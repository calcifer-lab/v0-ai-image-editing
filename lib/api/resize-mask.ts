/**
 * Mask-resize helper that depends on sharp's native binaries.
 *
 * Isolated in its own module so that routes which don't need server-side
 * mask resizing (e.g. /api/remove-background) won't bundle sharp via
 * Vercel's tracing of @/lib/api re-exports.
 */

import { getImageDimensions } from "./replicate"

export async function resizeMaskToMatchImage(
  maskBase64: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const maskDims = await getImageDimensions(maskBase64)

  if (maskDims.width === targetWidth && maskDims.height === targetHeight) {
    return maskBase64
  }

  console.log(`[API] Resizing mask from ${maskDims.width}x${maskDims.height} to ${targetWidth}x${targetHeight}`)

  try {
    const sharp = (await import("sharp")).default
    const base64Data = maskBase64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    const resizedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, { fit: "fill" })
      .png()
      .toBuffer()

    return `data:image/png;base64,${resizedBuffer.toString("base64")}`
  } catch (error) {
    console.error("[API] Sharp not available, cannot resize mask:", error)
    return maskBase64
  }
}
