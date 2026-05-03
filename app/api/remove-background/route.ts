import { NextRequest, NextResponse } from "next/server"
import type { RemoveBackgroundRequest, RemoveBackgroundResponse, ApiErrorResponse } from "@/types"
import { pollReplicatePrediction, urlToBase64, extractOutputUrl, validateImageDataUrl } from "@/lib/api"
import { logStageEvent, resolveRequestId } from "@/lib/observability/log-stage"

export const runtime = "nodejs"
export const maxDuration = 120
const MAX_REMOVE_BACKGROUND_BYTES = 12 * 1024 * 1024

export async function POST(
  request: NextRequest
): Promise<NextResponse<RemoveBackgroundResponse | ApiErrorResponse>> {
  const startTime = Date.now()
  const requestId = resolveRequestId(request.headers.get("x-request-id"))

  try {
    const body: RemoveBackgroundRequest = await request.json()
    const { image } = body

    const validatedImage = validateImageDataUrl(image, {
      fieldName: "image",
      maxBytes: MAX_REMOVE_BACKGROUND_BYTES,
    })
    if (!validatedImage.ok) {
      logStageEvent("warn", {
        requestId,
        stage: "process",
        provider: "replicate",
        error_code: `INVALID_INPUT_${validatedImage.status}`,
        message: validatedImage.error,
      })
      return NextResponse.json({ error: validatedImage.error }, { status: validatedImage.status })
    }

    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (!replicateApiKey) {
      logStageEvent("error", {
        requestId,
        stage: "process",
        provider: "replicate",
        error_code: "REPLICATE_API_KEY_MISSING",
      })
      return NextResponse.json({ error: "REPLICATE_API_KEY not configured" }, { status: 500 })
    }

    const imageBytes = validatedImage.image.bytes
    logStageEvent("info", {
      requestId,
      stage: "process",
      provider: "replicate",
      model: "rembg",
      input_meta: { bytes: imageBytes },
      message: "remove-background request received",
    })
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
      logStageEvent("error", {
        requestId,
        stage: "process",
        provider: "replicate",
        model: "rembg",
        error_code: `HTTP_${response.status}`,
        elapsed_ms: Date.now() - startTime,
        message: errorText.slice(0, 200),
      })
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
        logStageEvent("info", {
          requestId,
          stage: "process",
          provider: "replicate",
          model: "rembg",
          elapsed_ms: Date.now() - startTime,
        })
        return NextResponse.json({
          result_image: resultImage,
          meta: { model: "rembg", duration_ms: Date.now() - startTime, requestId },
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
      logStageEvent("error", {
        requestId,
        stage: "process",
        provider: "replicate",
        model: "rembg",
        error_code: "PREDICTION_FAILED",
        elapsed_ms: Date.now() - startTime,
        message: result.error || "Background removal failed",
      })
      return NextResponse.json(
        { error: result.error || "Background removal failed" },
        { status: 500 }
      )
    }

    const outputUrl = extractOutputUrl(result.output)
    if (!outputUrl) {
      logStageEvent("error", {
        requestId,
        stage: "process",
        provider: "replicate",
        model: "rembg",
        error_code: "NO_OUTPUT_URL",
        elapsed_ms: Date.now() - startTime,
      })
      return NextResponse.json({ error: "No output URL in prediction result" }, { status: 500 })
    }

    const resultImage = await urlToBase64(outputUrl)
    logStageEvent("info", {
      requestId,
      stage: "process",
      provider: "replicate",
      model: "rembg",
      elapsed_ms: Date.now() - startTime,
    })
    return NextResponse.json({
      result_image: resultImage,
      meta: { model: "rembg", duration_ms: Date.now() - startTime, requestId },
    })
  } catch (error) {
    logStageEvent("error", {
      requestId,
      stage: "process",
      provider: "replicate",
      model: "rembg",
      error_code: "UNHANDLED_EXCEPTION",
      elapsed_ms: Date.now() - startTime,
      message: error instanceof Error ? error.message : "unknown",
    })
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
