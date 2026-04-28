import { NextRequest, NextResponse } from "next/server"
import type { RemoveBackgroundRequest, RemoveBackgroundResponse, ApiErrorResponse } from "@/types"
import { pollReplicatePrediction, urlToBase64, extractOutputUrl, validateImageDataUrl } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 120
const MAX_REMOVE_BACKGROUND_BYTES = 12 * 1024 * 1024

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

    const candidateModels = [
      "lucataco/remove-bg",
      "lucataco/rembg",
    ]

    let response: Response | null = null
    let selectedModel: string | null = null

    for (const model of candidateModels) {
      console.log(`[RemoveBG] Trying Replicate model: ${model}`)
      const attempt = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateApiKey}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: { image: validatedImage.image.dataUrl },
        }),
      })

      if (attempt.ok) {
        response = attempt
        selectedModel = model
        break
      }

      // 404 generally means the model slug is unavailable in this account/region.
      if (attempt.status !== 404) {
        response = attempt
        selectedModel = model
        break
      }

      console.warn(`[RemoveBG] Model not found: ${model} (404), trying next candidate...`)
    }

    if (!response) {
      console.warn("[RemoveBG] No Replicate remove-background model available. Returning original image.")
      return NextResponse.json({
        result_image: validatedImage.image.dataUrl,
        meta: { model: "passthrough-original", duration_ms: Date.now() - startTime },
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 404) {
        console.warn("[RemoveBG] Replicate model endpoint unavailable (404). Returning original image.")
        return NextResponse.json({
          result_image: validatedImage.image.dataUrl,
          meta: { model: "passthrough-original", duration_ms: Date.now() - startTime },
        })
      }
      console.error("[RemoveBG] Replicate API error:", errorText)
      return NextResponse.json(
        { error: `Replicate API error: ${response.status}` },
        { status: response.status }
      )
    }

    const prediction = await response.json()
    console.log("[RemoveBG] Prediction response:", prediction.status)

    // 检查是否直接返回了结果
    if (prediction.output) {
      const outputUrl = extractOutputUrl(prediction.output)
      if (outputUrl) {
        const resultImage = await urlToBase64(outputUrl)
        return NextResponse.json({
          result_image: resultImage,
          meta: { model: selectedModel || "remove-bg", duration_ms: Date.now() - startTime },
        })
      }
    }

    // 轮询获取结果
    const result = await pollReplicatePrediction(
      prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
      replicateApiKey,
      60,
      2000
    )

    if (result.status !== "succeeded" || !result.output) {
      return NextResponse.json(
        { error: result.error || "Background removal failed" },
        { status: 500 }
      )
    }

    const outputUrl = extractOutputUrl(result.output)
    if (!outputUrl) {
      return NextResponse.json({ error: "No output URL in prediction result" }, { status: 500 })
    }

    const resultImage = await urlToBase64(outputUrl)
    return NextResponse.json({
      result_image: resultImage,
      meta: { model: selectedModel || "remove-bg", duration_ms: Date.now() - startTime },
    })
  } catch (error) {
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
