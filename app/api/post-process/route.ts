import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

interface PostProcessRequest {
  result_image: string // base64
  base_image: string // base64 for reference
  mask_image: string // base64
  options?: {
    blend_edges?: boolean
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
        // Get metadata from result image to ensure dimensions match
        const resultMetadata = await sharp(resultBuffer).metadata()
        const maskWidth = resultMetadata.width || 0
        const maskHeight = resultMetadata.height || 0

        // Create a blurred version of the mask for soft edges
        const blurredMask = await sharp(maskBuffer)
          .resize(maskWidth, maskHeight, { fit: "fill" })
          .blur(blur_radius)
          .toFormat("png")
          .toBuffer()

        // Extract the alpha channel from the blurred mask (assuming mask is white areas on black background)
        // We need to convert the mask to an alpha channel
        const blurredMaskWithAlpha = await sharp(blurredMask)
          .extractChannel("red") // Use red channel as grayscale mask
          .toBuffer()

        const { data: resultPixels, info } = await sharp(resultBuffer)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true })

        const alphaPixels = await sharp(blurredMaskWithAlpha)
          .resize(info.width, info.height, { fit: "fill" })
          .raw()
          .toBuffer()

        // Replace the alpha channel directly because Sharp does not support
        // `replaceAlpha` in joinChannel options.
        for (let pixelIndex = 0; pixelIndex < info.width * info.height; pixelIndex += 1) {
          resultPixels[pixelIndex * 4 + 3] = alphaPixels[pixelIndex]
        }

        const resultWithAlpha = await sharp(resultPixels, {
          raw: {
            width: info.width,
            height: info.height,
            channels: info.channels,
          },
        })
          .png()
          .toBuffer()

        // Composite the result with the base using the blurred mask as alpha
        processedImage = await sharp(baseBuffer)
          .composite([
            {
              input: resultWithAlpha,
              blend: "over",
            },
          ])
          .toBuffer()
      } catch (error) {
        console.warn("[PostProcess] Edge blending failed, returning original result:", error)
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
    console.error("[PostProcess] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post-process image" },
      { status: 500 },
    )
  }
}
