import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 120

interface RemoveBackgroundRequest {
  image: string // base64 encoded image
}

interface RemoveBackgroundResponse {
  result_image: string
  meta: {
    model: string
    duration_ms: number
  }
}

// Helper to poll for Replicate prediction result
async function pollReplicatePrediction(
  predictionUrl: string,
  apiKey: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<{ status: string; output?: string | string[]; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(predictionUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`)
    }

    const prediction = await response.json()
    console.log(`[RemoveBG] Poll ${i + 1}/${maxAttempts}: status = ${prediction.status}`)

    if (prediction.status === "succeeded") {
      return prediction
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      return { status: prediction.status, error: prediction.error || "Prediction failed" }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Prediction timed out")
}

// Fetch image from URL and convert to base64
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const contentType = response.headers.get("content-type") || "image/png"
  return `data:${contentType};base64,${base64}`
}

export async function POST(request: NextRequest): Promise<NextResponse<RemoveBackgroundResponse | { error: string }>> {
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

    // Use BRIA RMBG model for background removal
    const createResponse = await fetch("https://api.replicate.com/v1/models/lucataco/rembg/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateApiKey}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        input: {
          image: image,
        },
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("[RemoveBG] Replicate API error:", errorText)
      return NextResponse.json(
        { error: `Replicate API error: ${createResponse.status}` },
        { status: createResponse.status }
      )
    }

    const prediction = await createResponse.json()
    console.log("[RemoveBG] Prediction response:", prediction.status)

    // Check if we got the result directly
    if (prediction.output) {
      const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      const resultImage = await urlToBase64(outputUrl)
      const duration = Date.now() - startTime

      return NextResponse.json({
        result_image: resultImage,
        meta: {
          model: "rembg",
          duration_ms: duration,
        },
      })
    }

    // Poll for result
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

    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output
    const resultImage = await urlToBase64(outputUrl)
    const duration = Date.now() - startTime

    return NextResponse.json({
      result_image: resultImage,
      meta: {
        model: "rembg",
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("[RemoveBG] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 }
    )
  }
}
