import { NextRequest, NextResponse } from "next/server"
import type { RemoveBackgroundRequest, RemoveBackgroundResponse, ApiErrorResponse } from "@/types"
import { pollReplicatePrediction, urlToBase64, extractOutputUrl, validateImageDataUrl } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 120
const MAX_REMOVE_BACKGROUND_BYTES = 12 * 1024 * 1024

// Replicate model chain.
// `api: "official"` uses /v1/models/{slug}/predictions (works only for models the
//   owner has marked as official models API — saves one round-trip).
// `api: "versioned"` looks up latest_version then POSTs to /v1/predictions (works
//   for any published model, +1 API call).
//
// 851-labs/background-remover (BiRefNet, cleaner edges) — no official API → versioned.
// lucataco/remove-bg (faster fallback) — has official API.
type ModelApi = "official" | "versioned"
interface ModelConfig {
  slug: string
  api: ModelApi
}
const MODEL_CHAIN: ModelConfig[] = [
  { slug: "851-labs/background-remover", api: "versioned" },
  { slug: "lucataco/remove-bg", api: "official" },
]

interface ModelSuccess {
  ok: true
  resultImage: string
  model: string
  api: ModelApi
}
interface ModelFailure {
  ok: false
  model: string
  api: ModelApi
  status: number
  message: string
}
type ModelResult = ModelSuccess | ModelFailure

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postPrediction(
  url: string,
  apiKey: string,
  body: object
): Promise<{ ok: true; prediction: any } | { ok: false; status: number; message: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    return { ok: false, status: response.status, message: errorText.slice(0, 200) || `HTTP ${response.status}` }
  }

  const prediction = await response.json()
  return { ok: true, prediction }
}

async function resolvePrediction(
  prediction: any,
  apiKey: string
): Promise<{ ok: true; outputUrl: string } | { ok: false; status: number; message: string }> {
  // Sync inline result (Prefer: wait sometimes returns output immediately)
  if (prediction.output) {
    const outputUrl = extractOutputUrl(prediction.output)
    if (outputUrl) return { ok: true, outputUrl }
  }

  const result = await pollReplicatePrediction(
    prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
    apiKey,
    60,
    2000
  )

  if (result.status !== "succeeded" || !result.output) {
    return { ok: false, status: 502, message: result.error || "Prediction did not succeed" }
  }

  const outputUrl = extractOutputUrl(result.output)
  if (!outputUrl) return { ok: false, status: 502, message: "No output URL in prediction result" }
  return { ok: true, outputUrl }
}

async function callOfficialModel(
  slug: string,
  imageDataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const post = await postPrediction(
    `https://api.replicate.com/v1/models/${slug}/predictions`,
    apiKey,
    { input: { image: imageDataUrl } }
  )
  if (!post.ok) {
    return { ok: false, model: slug, api: "official", status: post.status, message: post.message }
  }

  const resolved = await resolvePrediction(post.prediction, apiKey)
  if (!resolved.ok) {
    return { ok: false, model: slug, api: "official", status: resolved.status, message: resolved.message }
  }

  const resultImage = await urlToBase64(resolved.outputUrl)
  return { ok: true, resultImage, model: slug, api: "official" }
}

async function callVersionedModel(
  slug: string,
  imageDataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  // 1. Look up latest version of the model
  const modelInfoRes = await fetch(`https://api.replicate.com/v1/models/${slug}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!modelInfoRes.ok) {
    const errorText = await modelInfoRes.text().catch(() => "")
    return {
      ok: false,
      model: slug,
      api: "versioned",
      status: modelInfoRes.status,
      message: `model lookup failed: ${errorText.slice(0, 200) || modelInfoRes.status}`,
    }
  }
  const modelInfo = await modelInfoRes.json()
  const versionId: string | undefined = modelInfo?.latest_version?.id
  if (!versionId) {
    return {
      ok: false,
      model: slug,
      api: "versioned",
      status: 502,
      message: "model has no latest_version",
    }
  }

  // 2. Create prediction against that version
  const post = await postPrediction(
    "https://api.replicate.com/v1/predictions",
    apiKey,
    { version: versionId, input: { image: imageDataUrl } }
  )
  if (!post.ok) {
    return { ok: false, model: slug, api: "versioned", status: post.status, message: post.message }
  }

  const resolved = await resolvePrediction(post.prediction, apiKey)
  if (!resolved.ok) {
    return { ok: false, model: slug, api: "versioned", status: resolved.status, message: resolved.message }
  }

  const resultImage = await urlToBase64(resolved.outputUrl)
  return { ok: true, resultImage, model: slug, api: "versioned" }
}

function parseRetryAfter(message: string): number | null {
  // Replicate puts the recommended wait inside the JSON body, e.g.
  // {"detail":"...","status":429,"retry_after":4}
  const match = message.match(/"retry_after"\s*:\s*(\d+(?:\.\d+)?)/)
  if (!match) return null
  const seconds = Number(match[1])
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  return seconds
}

async function callModelWithRetry(
  config: ModelConfig,
  imageDataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const invoke = config.api === "official" ? callOfficialModel : callVersionedModel
  let attempt = await invoke(config.slug, imageDataUrl, apiKey)
  // Retry once on 429, honoring upstream `retry_after` (in seconds) when provided
  // (with a small jitter buffer); fall back to a 2s backoff. Persistent 429 means
  // the account is genuinely throttled and looping won't help — return upstream.
  if (!attempt.ok && attempt.status === 429) {
    const retryAfter = parseRetryAfter(attempt.message)
    const waitMs = retryAfter ? Math.ceil(retryAfter * 1000 + 250) : 2000
    console.warn(`[RemoveBG] ${config.slug} 429 — retrying after ${waitMs}ms backoff`)
    await sleep(waitMs)
    attempt = await invoke(config.slug, imageDataUrl, apiKey)
  }
  return attempt
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
    const imageDataUrl = validatedImage.image.dataUrl

    const failures: ModelFailure[] = []

    for (const config of MODEL_CHAIN) {
      const attempt = await callModelWithRetry(config, imageDataUrl, replicateApiKey)
      if (attempt.ok) {
        console.log(`[RemoveBG] Success via ${attempt.model} (${attempt.api})`)
        return NextResponse.json({
          result_image: attempt.resultImage,
          meta: { model: `${attempt.model}/${attempt.api}`, duration_ms: Date.now() - startTime },
        })
      }
      console.warn(
        `[RemoveBG] ${attempt.model} (${attempt.api}) failed: ${attempt.status} — ${attempt.message}`
      )
      failures.push(attempt)
    }

    const summary = failures.map((f) => `${f.model}(${f.api}):${f.status}`).join("; ")
    console.error(`[RemoveBG] All models failed: ${summary}`)
    // If every model returned a rate limit, surface 429 so the client can show
    // a "quota exhausted" message rather than a generic failure.
    const allRateLimited = failures.every((f) => f.status === 429)
    const upstreamStatus = allRateLimited ? 429 : 502
    return NextResponse.json(
      { error: `Background removal failed: ${summary}` },
      { status: upstreamStatus }
    )
  } catch (error) {
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
