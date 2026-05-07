import { NextRequest, NextResponse } from "next/server"
import type { RemoveBackgroundRequest, RemoveBackgroundResponse, ApiErrorResponse } from "@/types"
import { pollReplicatePrediction, urlToBase64, extractOutputUrl, validateImageDataUrl } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 120
const MAX_REMOVE_BACKGROUND_BYTES = 12 * 1024 * 1024

// Replicate model chain. Primary uses BiRefNet (cleaner edges, fewer artifacts).
// Fallback is the faster rembg variant. The previous "lucataco/rembg" path was
// a stale model slug that returned 404 from Replicate.
const PRIMARY_MODEL = "851-labs/background-remover"
const FALLBACK_MODEL = "lucataco/remove-bg"

interface ModelAttempt {
  ok: true
  resultImage: string
  model: string
}

interface ModelFailure {
  ok: false
  model: string
  status: number
  message: string
}

type ModelResult = ModelAttempt | ModelFailure

async function callReplicateModel(
  model: string,
  imageDataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: { image: imageDataUrl },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    console.error(`[RemoveBG] ${model} API error (${response.status}):`, errorText.slice(0, 200))
    return {
      ok: false,
      model,
      status: response.status,
      message: errorText.slice(0, 200) || `HTTP ${response.status}`,
    }
  }

  const prediction = await response.json()
  console.log(`[RemoveBG] ${model} prediction status:`, prediction.status)

  // Sync path — Prefer:wait may have completed inline
  if (prediction.output) {
    const outputUrl = extractOutputUrl(prediction.output)
    if (outputUrl) {
      const resultImage = await urlToBase64(outputUrl)
      return { ok: true, resultImage, model }
    }
  }

  // Async path — poll
  const result = await pollReplicatePrediction(
    prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
    apiKey,
    60,
    2000
  )

  if (result.status !== "succeeded" || !result.output) {
    return {
      ok: false,
      model,
      status: 502,
      message: result.error || "Prediction did not succeed",
    }
  }

  const outputUrl = extractOutputUrl(result.output)
  if (!outputUrl) {
    return { ok: false, model, status: 502, message: "No output URL in prediction result" }
  }

  const resultImage = await urlToBase64(outputUrl)
  return { ok: true, resultImage, model }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RemoveBackgroundResponse | ApiErrorResponse>> {
  const startTime = Date.now()

  try {
    const body: RemoveBackgroundRequest = await request.json()
    const { image } = body

    const validatedImage = validateImageDataUrl(image, {
      fieldName: "image",
      maxBytes: MAX_REMOVE_BACKGROUND_BYTES,
    })
    if (!validatedImage.ok) {
      return NextResponse.json({ error: validatedImage.error }, { status: validatedImage.status })
    }

    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (!replicateApiKey) {
      return NextResponse.json({ error: "REPLICATE_API_KEY not configured" }, { status: 500 })
    }

    const imageBytes = validatedImage.image.bytes
    console.log(`[RemoveBG] Image size: ${Math.round(imageBytes / 1024)}KB`)

    // Client-side compressDataUrlForUpload caps uploads at 2048×2048 / JPEG 0.85,
    // so server-side recompression isn't needed. Oversized payloads naturally
    // fall through to Replicate's async polling path below.
    const imageDataUrl = validatedImage.image.dataUrl

    const failures: ModelFailure[] = []

    // Try primary model
    const primary = await callReplicateModel(PRIMARY_MODEL, imageDataUrl, replicateApiKey)
    if (primary.ok) {
      return NextResponse.json({
        result_image: primary.resultImage,
        meta: { model: primary.model, duration_ms: Date.now() - startTime },
      })
    }
    failures.push(primary)
    console.warn(`[RemoveBG] Primary ${PRIMARY_MODEL} failed (${primary.status}); trying fallback ${FALLBACK_MODEL}`)

    // Fall back
    const fallback = await callReplicateModel(FALLBACK_MODEL, imageDataUrl, replicateApiKey)
    if (fallback.ok) {
      return NextResponse.json({
        result_image: fallback.resultImage,
        meta: { model: fallback.model, duration_ms: Date.now() - startTime },
      })
    }
    failures.push(fallback)

    const summary = failures.map((f) => `${f.model}:${f.status}`).join("; ")
    console.error(`[RemoveBG] All models failed: ${summary}`)
    return NextResponse.json(
      { error: `Background removal failed: ${summary}` },
      { status: failures[failures.length - 1].status === 404 ? 502 : failures[failures.length - 1].status }
    )
  } catch (error) {
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
