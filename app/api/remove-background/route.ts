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

    const imageBytes = validatedImage.image.bytes
    console.log(`[RemoveBG] Image size: ${Math.round(imageBytes / 1024)}KB`)

    // Client-side compressDataUrlForUpload already caps uploads at 2048×2048 / JPEG 0.85,
    // so server-side sharp recompression is redundant. Skipping it lets this serverless
    // function stay under Vercel's 50MB bundle limit (sharp's native binaries push it over).
    // If a payload still arrives oversized, Replicate's async endpoint will handle it
    // via the polling path below.
    const imageDataUrl = validatedImage.image.dataUrl

    console.log("[RemoveBG] Calling Replicate rembg...")
    const response = await fetch("https://api.replicate.com/v1/models/lucataco/rembg/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateApiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: { image: imageDataUrl },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[RemoveBG] Replicate API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Replicate API error ${response.status}: ${errorText.slice(0, 200)}` },
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
          meta: { model: "rembg", duration_ms: Date.now() - startTime },
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
      meta: { model: "rembg", duration_ms: Date.now() - startTime },
    })
  } catch (error) {
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
