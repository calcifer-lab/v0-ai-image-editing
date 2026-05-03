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

    // Replicate's synchronous endpoint is unreliable above ~1.5 MB decoded.
    // If the image is larger, recompress it with sharp before sending.
    let imageDataUrl = validatedImage.image.dataUrl
    if (imageBytes > 1.5 * 1024 * 1024) {
      try {
        console.log("[RemoveBG] Image too large — recompressing with sharp...")
        const sharp = (await import("sharp")).default
        const base64Data = imageDataUrl.replace(/^data:[^;]+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")
        const resizedBuffer = await sharp(buffer)
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()
        imageDataUrl = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`
        console.log(`[RemoveBG] Recompressed to ${Math.round(resizedBuffer.length / 1024)}KB`)
      } catch (sharpErr) {
        console.warn("[RemoveBG] Sharp recompression failed, using original:", sharpErr)
      }
    }

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
