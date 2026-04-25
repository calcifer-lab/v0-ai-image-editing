/**
 * Image utilities for processing and validation
 */

export interface ImageDimensions {
  width: number
  height: number
}

/**
 * Load an image from a data URL or blob URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Get image dimensions from a data URL
 */
export async function getImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  const img = await loadImage(dataUrl)
  return { width: img.width, height: img.height }
}

/**
 * Resize an image to fit within max dimensions while maintaining aspect ratio
 */
export async function resizeImage(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl)

  let { width, height } = img

  // Calculate new dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  // If no resize needed, return original
  if (width === img.width && height === img.height) {
    return { dataUrl, width, height }
  }

  // Resize using canvas
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  ctx.drawImage(img, 0, 0, width, height)

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  }
}

/**
 * Ensure mask image matches base image dimensions
 */
export async function resizeMaskToMatch(maskDataUrl: string, targetWidth: number, targetHeight: number): Promise<string> {
  const img = await loadImage(maskDataUrl)

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  // Fill with black first (unselected)
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  // Draw mask image scaled
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  return canvas.toDataURL("image/png")
}

/**
 * Validate file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

/**
 * Validate file size (in MB)
 */
export function isFileSizeValid(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024
}

/**
 * Convert File to data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Download data URL as file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  link.click()
}

/**
 * Extract file extension from data URL
 */
export function getDataUrlExtension(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/)
  return match ? match[1] : "png"
}

/**
 * Apply edge smoothing to mask (simple blur)
 */
export async function smoothMaskEdges(maskDataUrl: string, blurRadius: number = 5): Promise<string> {
  const img = await loadImage(maskDataUrl)

  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  // Apply blur filter
  ctx.filter = `blur(${blurRadius}px)`
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL("image/png")
}

/**
 * Compress image quality
 */
export async function compressImage(dataUrl: string, quality: number = 0.8): Promise<string> {
  const img = await loadImage(dataUrl)

  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  ctx.drawImage(img, 0, 0)

  // Use JPEG compression if quality < 1
  return canvas.toDataURL("image/jpeg", quality)
}

/**
 * Remove AI watermark from image by cropping the bottom area
 * Common watermarks: "由**AI生成", "Created by AI", etc.
 * These typically appear at the bottom of AI-generated images
 */
export async function removeWatermark(dataUrl: string, cropHeight: number = 40): Promise<string> {
  const img = await loadImage(dataUrl)

  // Only crop if image is large enough
  if (img.height <= cropHeight * 2) {
    return dataUrl
  }

  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height - cropHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  // Draw image without the bottom watermark area
  ctx.drawImage(
    img,
    0, 0, img.width, img.height - cropHeight, // source: full width, height minus watermark
    0, 0, img.width, img.height - cropHeight  // destination: same size
  )

  return canvas.toDataURL("image/png")
}

/**
 * Detect if image likely has AI watermark at bottom
 * Checks for common watermark patterns by analyzing the bottom region
 */
export async function detectWatermark(dataUrl: string): Promise<boolean> {
  const img = await loadImage(dataUrl)

  // Only check images larger than a minimum size
  if (img.height < 200) return false

  const canvas = document.createElement("canvas")
  const checkHeight = 50
  canvas.width = img.width
  canvas.height = checkHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) return false

  // Draw only the bottom portion
  ctx.drawImage(
    img,
    0, img.height - checkHeight, img.width, checkHeight,
    0, 0, img.width, checkHeight
  )

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Check for semi-transparent overlay (common in watermarks)
  // or high contrast text area at the bottom
  let whitePixels = 0
  let totalPixels = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Count light/white pixels (potential watermark background)
    if (r > 200 && g > 200 && b > 200) {
      whitePixels++
    }
  }

  // If more than 30% of bottom area is white/light, likely has watermark
  return (whitePixels / totalPixels) > 0.3
}

/**
 * Aspect ratio configurations
 */
export const ASPECT_RATIOS = {
  "original": { ratio: null, label: "Original", description: "Keep original dimensions" },
  "1:1": { ratio: 1, label: "1:1", description: "Square (Instagram)" },
  "4:3": { ratio: 4 / 3, label: "4:3", description: "Standard (1024×768)" },
  "16:9": { ratio: 16 / 9, label: "16:9", description: "Widescreen (1920×1080)" },
  "3:2": { ratio: 3 / 2, label: "3:2", description: "Classic photo (DSLR)" },
  "9:16": { ratio: 9 / 16, label: "9:16", description: "Vertical (Stories)" },
  "custom": { ratio: null, label: "Custom", description: "Enter custom dimensions" },
} as const

export type AspectRatioKey = keyof typeof ASPECT_RATIOS

/**
 * Calculate target dimensions based on aspect ratio
 */
export function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  aspectRatioKey: AspectRatioKey,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  if (aspectRatioKey === "original") {
    return { width: originalWidth, height: originalHeight }
  }

  if (aspectRatioKey === "custom" && customWidth && customHeight) {
    return { width: customWidth, height: customHeight }
  }

  const ratioConfig = ASPECT_RATIOS[aspectRatioKey]
  if (!ratioConfig.ratio) {
    return { width: originalWidth, height: originalHeight }
  }

  const targetRatio = ratioConfig.ratio
  const originalRatio = originalWidth / originalHeight

  // Maintain the larger dimension, adjust the other
  if (targetRatio > originalRatio) {
    // Target is wider
    const width = originalWidth
    const height = Math.round(width / targetRatio)
    return { width, height }
  } else {
    // Target is taller
    const height = originalHeight
    const width = Math.round(height * targetRatio)
    return { width, height }
  }
}

/**
 * Resize image to target aspect ratio with different scale modes
 */
/**
 * Composite reference image onto base image using mask
 * This is a direct "paste" operation without AI generation
 * 
 * The reference image is scaled to fit the mask area while maintaining aspect ratio,
 * then only the pixels within the mask are composited onto the base image.
 */
export async function compositeImages(
  baseImageUrl: string,
  referenceImageUrl: string,
  maskImageUrl: string,
  maskCoordinates: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const [baseImg, refImg, maskImg] = await Promise.all([
    loadImage(baseImageUrl),
    loadImage(referenceImageUrl),
    loadImage(maskImageUrl),
  ])

  console.log("[Composite] Base image:", baseImg.width, "x", baseImg.height)
  console.log("[Composite] Reference image:", refImg.width, "x", refImg.height)
  console.log("[Composite] Mask image:", maskImg.width, "x", maskImg.height)
  console.log("[Composite] Mask coordinates:", maskCoordinates)

  // Create canvas with base image dimensions
  const canvas = document.createElement("canvas")
  canvas.width = baseImg.width
  canvas.height = baseImg.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  // Draw base image first
  ctx.drawImage(baseImg, 0, 0)

  // Calculate scale factors between mask canvas and actual base image
  const scaleX = baseImg.width / maskImg.width
  const scaleY = baseImg.height / maskImg.height

  // Scale mask coordinates to actual base image dimensions
  const targetX = Math.round(maskCoordinates.x * scaleX)
  const targetY = Math.round(maskCoordinates.y * scaleY)
  const targetWidth = Math.round(maskCoordinates.width * scaleX)
  const targetHeight = Math.round(maskCoordinates.height * scaleY)

  console.log("[Composite] Target area:", targetX, targetY, targetWidth, targetHeight)

  // Calculate how to fit reference image into target area (maintain aspect ratio)
  const refAspect = refImg.width / refImg.height
  const targetAspect = targetWidth / targetHeight
  
  let srcX = 0, srcY = 0, srcWidth = refImg.width, srcHeight = refImg.height
  
  if (refAspect > targetAspect) {
    // Reference is wider - crop sides
    srcWidth = refImg.height * targetAspect
    srcX = (refImg.width - srcWidth) / 2
  } else {
    // Reference is taller - crop top/bottom
    srcHeight = refImg.width / targetAspect
    srcY = (refImg.height - srcHeight) / 2
  }

  // Create a temporary canvas for the reference image at target size
  const refCanvas = document.createElement("canvas")
  refCanvas.width = targetWidth
  refCanvas.height = targetHeight
  const refCtx = refCanvas.getContext("2d")
  if (!refCtx) throw new Error("Failed to get ref canvas context")

  // Draw reference image scaled and cropped to fit target area
  refCtx.drawImage(
    refImg,
    srcX, srcY, srcWidth, srcHeight,
    0, 0, targetWidth, targetHeight
  )

  // ── Proper alpha compositing ──────────────────────────────────────────
  // We no longer cut a hard hole in the base via destination-out.
  // Instead, we use the mask as a soft alpha matte for the reference,
  // so edge feathering blends naturally with the base (remove.bg-level quality).
  //
  // Strategy:
  // 1. Build a feathered alpha matte from the mask at base resolution
  //    (3px Gaussian blur ≈ natural edge softness, matches human perception)
  // 2. Apply the matte to the reference pixel data → weighted blend with base
  // 3. Result: reference seamlessly transitions from opaque → transparent
  //    at the mask boundary, no hard edge, no misalignment artifacts
  //
  // Step 1: build feathered alpha matte at target region resolution
  //    First draw the mask at target size (not full base size) with blur
  const matteeCanvas = document.createElement("canvas")
  matteeCanvas.width = targetWidth
  matteeCanvas.height = targetHeight
  const matteeCtx = matteeCanvas.getContext("2d")
  if (!matteeCtx) throw new Error("Failed to get matte canvas context")

  // Scale the original mask (at its own resolution) to target region size with blur
  // maskImg is at base's resized canvas dimensions; maskCoordinates are in the same space
  matteeCtx.filter = "blur(2.5px)"
  matteeCtx.drawImage(
    maskImg,
    maskCoordinates.x, maskCoordinates.y,
    maskCoordinates.width, maskCoordinates.height,
    0, 0, targetWidth, targetHeight
  )
  matteeCtx.filter = "none"

  // Get pixel data for all three layers
  const matteData = matteeCtx.getImageData(0, 0, targetWidth, targetHeight)
  const refData = refCtx.getImageData(0, 0, targetWidth, targetHeight)
  const baseData = ctx.getImageData(targetX, targetY, targetWidth, targetHeight)

  // Step 2: alpha composite reference onto base using feathered matte
  // matte pixel value → blend weight for reference (0=black/keep base, 255=white/use reference)
  // reference alpha  → element opacity at this pixel (from background removal)
  // combined = matte_weight × ref_opacity
  for (let i = 0; i < matteData.data.length; i += 4) {
    const matteWeight = matteData.data[i] / 255          // 0-1: how much reference at this pixel
    const refAlpha    = refData.data[i + 3] / 255        // 0-1: how opaque the reference pixel is
    const blend       = Math.min(matteWeight, refAlpha)  // soft min: avoids halos at ref edges

    refData.data[i]     = Math.round(refData.data[i]     * blend + baseData.data[i]     * (1 - blend))
    refData.data[i + 1] = Math.round(refData.data[i + 1] * blend + baseData.data[i + 1] * (1 - blend))
    refData.data[i + 2] = Math.round(refData.data[i + 2] * blend + baseData.data[i + 2] * (1 - blend))
    refData.data[i + 3] = 255
  }

  // Step 3: put blended pixel data back into the reference canvas, then composite
  refCtx.putImageData(refData, 0, 0)

  // Draw the feathered-composited reference at the correct position on base
  ctx.drawImage(refCanvas, targetX, targetY)

  console.log("[Composite] Alpha compositing with feathered matte complete")

  return canvas.toDataURL("image/png")
}

export async function resizeToAspectRatio(
  dataUrl: string,
  aspectRatioKey: AspectRatioKey,
  scaleMode: "fit" | "fill" | "stretch",
  customWidth?: number,
  customHeight?: number
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl)

  const targetDimensions = calculateAspectRatioDimensions(
    img.width,
    img.height,
    aspectRatioKey,
    customWidth,
    customHeight
  )

  const canvas = document.createElement("canvas")
  canvas.width = targetDimensions.width
  canvas.height = targetDimensions.height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  // Fill with white background
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  switch (scaleMode) {
    case "fit": {
      // Fit: maintain aspect ratio, may have borders
      const scale = Math.min(
        targetDimensions.width / img.width,
        targetDimensions.height / img.height
      )
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const x = (targetDimensions.width - scaledWidth) / 2
      const y = (targetDimensions.height - scaledHeight) / 2

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      break
    }

    case "fill": {
      // Fill: crop to fill entire canvas
      const scale = Math.max(
        targetDimensions.width / img.width,
        targetDimensions.height / img.height
      )
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const x = (targetDimensions.width - scaledWidth) / 2
      const y = (targetDimensions.height - scaledHeight) / 2

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      break
    }

    case "stretch": {
      // Stretch: ignore aspect ratio, stretch to fill
      ctx.drawImage(img, 0, 0, targetDimensions.width, targetDimensions.height)
      break
    }
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  }
}