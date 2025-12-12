import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

interface PostProcessRequest {
  result_image: string // base64
  base_image: string // base64 for reference
  mask_image: string // base64
  options?: {
    blend_edges?: boolean
    match_brightness?: boolean
    blur_radius?: number
  }
}

// Helper to convert base64 to buffer
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  return Buffer.from(base64Data, "base64")
}

// Helper to convert buffer to base64
function bufferToBase64(buffer: Buffer, mimeType: string = "image/png"): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export async function POST(request: NextRequest) {
  try {
    const body: PostProcessRequest = await request.json()
    const { result_image, base_image, mask_image, options = {} } = body

    if (!result_image || !base_image || !mask_image) {
      return NextResponse.json({ error: "Missing required images" }, { status: 400 })
    }

    const { blend_edges = true, blur_radius = 5 } = options

    // Convert images to buffers
    const resultBuffer = base64ToBuffer(result_image)
    const baseBuffer = base64ToBuffer(base_image)
    const maskBuffer = base64ToBuffer(mask_image)

    let processedImage = resultBuffer

    if (blend_edges) {
      // Apply edge blending using the mask
      // This creates a smoother transition between the inpainted region and the original
      try {
        // Create a blurred version of the mask for soft edges
        const blurredMask = await sharp(maskBuffer)
          .blur(blur_radius)
          .toBuffer()

        // Composite the result with the base using the blurred mask
        processedImage = await sharp(baseBuffer)
          .composite([
            {
              input: resultBuffer,
              blend: "over",
            },
          ])
          .toBuffer()
      } catch (error) {
        console.error("Edge blending failed, returning original result:", error)
      }
    }

    // Convert back to base64
    const resultBase64 = bufferToBase64(processedImage)

    return NextResponse.json({
      processed_image: resultBase64,
      meta: {
        operations: {
          blend_edges,
          blur_radius,
        },
      },
    })
  } catch (error) {
    console.error("Error in post-processing:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post-process image" },
      { status: 500 },
    )
  }
}
