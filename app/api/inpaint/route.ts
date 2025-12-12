import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes for model processing

interface InpaintRequest {
  base_image: string // B image (base64)
  mask_image: string // Mask (base64)
  reference_image?: string // A image (base64)
  prompt: string
  options?: {
    strength?: number
    steps?: number
    guidance_scale?: number
  }
}

interface InpaintResponse {
  result_image: string
  meta: {
    model: string
    duration_ms: number
  }
}

// Helper function to convert base64 to buffer
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  return Buffer.from(base64Data, "base64")
}

// Helper function to validate image format
function isValidImage(base64: string): boolean {
  return base64.startsWith("data:image/")
}

export async function POST(request: NextRequest): Promise<NextResponse<InpaintResponse | { error: string }>> {
  const startTime = Date.now()

  try {
    const body: InpaintRequest = await request.json()
    const { base_image, mask_image, reference_image, prompt, options = {} } = body

    // Validation
    if (!base_image || !mask_image || !prompt) {
      return NextResponse.json({ error: "base_image, mask_image, and prompt are required" }, { status: 400 })
    }

    if (!isValidImage(base_image) || !isValidImage(mask_image)) {
      return NextResponse.json({ error: "Invalid image format. Must be base64 encoded image." }, { status: 400 })
    }

    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (!replicateApiKey || replicateApiKey === "your_replicate_api_key_here") {
      console.warn("Replicate API key not configured. Returning mock result.")
      return mockInpaintResult(base_image, startTime)
    }

    // Call Replicate SDXL Inpainting model
    // Using stability-ai/sdxl as an example - you can switch to other inpainting models
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${replicateApiKey}`,
      },
      body: JSON.stringify({
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc", // SDXL Inpainting
        input: {
          image: base_image,
          mask: mask_image,
          prompt: prompt,
          num_inference_steps: options.steps || 30,
          guidance_scale: options.guidance_scale || 7.5,
          strength: options.strength || 0.9,
        },
      }),
    })

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text()
      console.error("Replicate API error:", errorText)
      return NextResponse.json({ error: `Replicate API error: ${errorText}` }, { status: replicateResponse.status })
    }

    const prediction = await replicateResponse.json()

    // Poll for completion
    let predictionResult = prediction
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    while (predictionResult.status !== "succeeded" && predictionResult.status !== "failed" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionResult.id}`, {
        headers: {
          Authorization: `Token ${replicateApiKey}`,
        },
      })

      predictionResult = await pollResponse.json()
      attempts++
    }

    if (predictionResult.status === "failed") {
      return NextResponse.json({ error: `Model processing failed: ${predictionResult.error}` }, { status: 500 })
    }

    if (predictionResult.status !== "succeeded") {
      return NextResponse.json({ error: "Model processing timeout" }, { status: 504 })
    }

    const resultImageUrl = predictionResult.output?.[0] || predictionResult.output

    if (!resultImageUrl) {
      return NextResponse.json({ error: "No output image from model" }, { status: 500 })
    }

    // Download result image and convert to base64
    const imageResponse = await fetch(resultImageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Result = `data:image/png;base64,${Buffer.from(imageBuffer).toString("base64")}`

    const duration = Date.now() - startTime

    return NextResponse.json({
      result_image: base64Result,
      meta: {
        model: "sdxl-inpainting",
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("Error in inpainting:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process inpainting request" },
      { status: 500 },
    )
  }
}

// Mock function for development/testing
function mockInpaintResult(base_image: string, startTime: number): NextResponse<InpaintResponse> {
  const duration = Date.now() - startTime + 2000 // Simulate 2 second processing

  return NextResponse.json({
    result_image: base_image, // Return original image as placeholder
    meta: {
      model: "mock-inpainting",
      duration_ms: duration,
    },
  })
}
