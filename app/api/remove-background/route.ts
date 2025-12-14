import { NextRequest, NextResponse } from "next/server"
import type { RemoveBackgroundRequest, RemoveBackgroundResponse, ApiErrorResponse } from "@/types"
import { pollReplicatePrediction, urlToBase64, extractOutputUrl } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(
  request: NextRequest
): Promise<NextResponse<RemoveBackgroundResponse | ApiErrorResponse>> {
  const startTime = Date.now()

  try {
    const body: RemoveBackgroundRequest = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (!replicateApiKey) {
      return NextResponse.json({ error: "REPLICATE_API_KEY not configured" }, { status: 500 })
    }

    console.log("[RemoveBG] Using Replicate RMBG model...")

    const response = await fetch("https://api.replicate.com/v1/models/lucataco/rembg/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateApiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: { image },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
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
