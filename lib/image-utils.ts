/**
 * Image utilities for processing and validation
 */

export interface ImageDimensions {
  width: number
  height: number
}

interface RegionStats {
  r: number
  g: number
  b: number
  luma: number
  count: number
}

export interface PatchPlacement {
  x: number
  y: number
  width: number
  height: number
}

export interface LocalFusionOptions {
  featherPx?: number
  toneMatchStrength?: number
  /** Overall blend opacity (0–1). Default 1.0 = full replacement; 0.5 = ghost overlay. */
  blendStrength?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function computeLuma(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114
}

interface SourceRect {
  srcX: number
  srcY: number
  srcWidth: number
  srcHeight: number
}

function fitReferenceToPlacement(
  refWidth: number,
  refHeight: number,
  targetWidth: number,
  targetHeight: number
): SourceRect {
  const refAspect = refWidth / refHeight
  const targetAspect = targetWidth / targetHeight

  let srcX = 0
  let srcY = 0
  let srcWidth = refWidth
  let srcHeight = refHeight

  if (refAspect > targetAspect) {
    srcWidth = refHeight * targetAspect
    srcX = (refWidth - srcWidth) / 2
  } else {
    srcHeight = refWidth / targetAspect
    srcY = (refHeight - srcHeight) / 2
  }

  return { srcX, srcY, srcWidth, srcHeight }
}

function findOpaqueBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = 12
): SourceRect | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      if (data[index + 3] < alphaThreshold) continue

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }

  return {
    srcX: minX,
    srcY: minY,
    srcWidth: maxX - minX + 1,
    srcHeight: maxY - minY + 1,
  }
}

function shouldPreserveTransparentCutout(bounds: SourceRect, refWidth: number, refHeight: number): boolean {
  const coversAlmostAllWidth = bounds.srcWidth >= refWidth - 2
  const coversAlmostAllHeight = bounds.srcHeight >= refHeight - 2
  return !(coversAlmostAllWidth && coversAlmostAllHeight)
}

function collectReferenceStats(data: Uint8ClampedArray): RegionStats {
  let r = 0
  let g = 0
  let b = 0
  let luma = 0
  let count = 0

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255
    if (alpha < 0.08) continue

    const weight = alpha
    const red = data[i]
    const green = data[i + 1]
    const blue = data[i + 2]

    r += red * weight
    g += green * weight
    b += blue * weight
    luma += computeLuma(red, green, blue) * weight
    count += weight
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0, luma: 0, count: 0 }
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
    luma: luma / count,
    count,
  }
}

function collectSurroundingStats(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  placement: PatchPlacement,
  margin: number
): RegionStats {
  let r = 0
  let g = 0
  let b = 0
  let luma = 0
  let count = 0

  const outerLeft = Math.max(0, placement.x - margin)
  const outerTop = Math.max(0, placement.y - margin)
  const outerRight = Math.min(width, placement.x + placement.width + margin)
  const outerBottom = Math.min(height, placement.y + placement.height + margin)

  for (let y = outerTop; y < outerBottom; y += 1) {
    for (let x = outerLeft; x < outerRight; x += 1) {
      const insidePatch =
        x >= placement.x &&
        x < placement.x + placement.width &&
        y >= placement.y &&
        y < placement.y + placement.height

      if (insidePatch) continue

      const dx = x < placement.x ? placement.x - x : x >= placement.x + placement.width ? x - (placement.x + placement.width - 1) : 0
      const dy = y < placement.y ? placement.y - y : y >= placement.y + placement.height ? y - (placement.y + placement.height - 1) : 0
      const distance = Math.max(dx, dy)
      if (distance > margin) continue

      const weight = 1 - distance / Math.max(1, margin)
      if (weight <= 0) continue

      const index = (y * width + x) * 4
      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]

      r += red * weight
      g += green * weight
      b += blue * weight
      luma += computeLuma(red, green, blue) * weight
      count += weight
    }
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0, luma: 0, count: 0 }
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
    luma: luma / count,
    count,
  }
}

function buildAlphaAwareFeatherMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  featherPx: number
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height)
  const safeFeather = Math.max(1, featherPx)
  const edgeThreshold = 12

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4
      const alpha = data[pixelIndex + 3]
      if (alpha <= edgeThreshold) {
        mask[y * width + x] = 0
        continue
      }

      let nearestTransparentDistance = safeFeather + 1

      for (let offsetY = -safeFeather; offsetY <= safeFeather; offsetY += 1) {
        const sampleY = y + offsetY
        if (sampleY < 0 || sampleY >= height) continue

        for (let offsetX = -safeFeather; offsetX <= safeFeather; offsetX += 1) {
          const sampleX = x + offsetX
          if (sampleX < 0 || sampleX >= width) continue

          const distance = Math.max(Math.abs(offsetX), Math.abs(offsetY))
          if (distance >= nearestTransparentDistance) continue

          const sampleIndex = (sampleY * width + sampleX) * 4
          if (data[sampleIndex + 3] > edgeThreshold) continue

          nearestTransparentDistance = distance
        }
      }

      const contourOpacity = nearestTransparentDistance > safeFeather
        ? 1
        : lerp(0.86, 1, smoothstep(0, safeFeather, nearestTransparentDistance))

      mask[y * width + x] = Math.round(contourOpacity * (alpha / 255) * 255)
    }
  }

  return mask
}

async function compositePatchOnBase(
  baseImageUrl: string,
  referenceImageUrl: string,
  placement: PatchPlacement,
  options: LocalFusionOptions = {},
  brushMaskCanvas?: HTMLCanvasElement
): Promise<string> {
  const [baseImg, refImg] = await Promise.all([
    loadImage(baseImageUrl),
    loadImage(referenceImageUrl),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = baseImg.width
  canvas.height = baseImg.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  ctx.drawImage(baseImg, 0, 0)

  const targetX = clamp(Math.round(placement.x), 0, baseImg.width)
  const targetY = clamp(Math.round(placement.y), 0, baseImg.height)
  const targetWidth = clamp(Math.round(placement.width), 1, baseImg.width - targetX)
  const targetHeight = clamp(Math.round(placement.height), 1, baseImg.height - targetY)

  const refCanvas = document.createElement("canvas")
  refCanvas.width = targetWidth
  refCanvas.height = targetHeight
  const refCtx = refCanvas.getContext("2d")
  if (!refCtx) throw new Error("Failed to get ref canvas context")

  const sourceCanvas = document.createElement("canvas")
  sourceCanvas.width = refImg.width
  sourceCanvas.height = refImg.height
  const sourceCtx = sourceCanvas.getContext("2d")
  if (!sourceCtx) throw new Error("Failed to get source canvas context")
  sourceCtx.drawImage(refImg, 0, 0)

  const sourceImageData = sourceCtx.getImageData(0, 0, refImg.width, refImg.height)
  const opaqueBounds = findOpaqueBounds(sourceImageData.data, refImg.width, refImg.height)

  if (opaqueBounds && shouldPreserveTransparentCutout(opaqueBounds, refImg.width, refImg.height)) {
    // Cover-scale: fill the target area, crop the excess — element never appears smaller than target
    const coverScale = Math.max(targetWidth / opaqueBounds.srcWidth, targetHeight / opaqueBounds.srcHeight)
    const drawWidth = opaqueBounds.srcWidth * coverScale
    const drawHeight = opaqueBounds.srcHeight * coverScale
    const drawX = (targetWidth - drawWidth) / 2
    const drawY = (targetHeight - drawHeight) / 2

    refCtx.drawImage(
      refImg,
      opaqueBounds.srcX,
      opaqueBounds.srcY,
      opaqueBounds.srcWidth,
      opaqueBounds.srcHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    )
  } else {
    const { srcX, srcY, srcWidth, srcHeight } = fitReferenceToPlacement(
      refImg.width,
      refImg.height,
      targetWidth,
      targetHeight
    )

    refCtx.drawImage(
      refImg,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      0,
      0,
      targetWidth,
      targetHeight
    )
  }

  const refData = refCtx.getImageData(0, 0, targetWidth, targetHeight)
  const baseData = ctx.getImageData(targetX, targetY, targetWidth, targetHeight)
  const fullBaseData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Extract brush mask region if provided (canvas mask from the editor brush/eraser tool)
  let brushMaskData: Uint8ClampedArray | null = null
  if (brushMaskCanvas) {
    const maskCtx = brushMaskCanvas.getContext("2d")
    if (maskCtx) {
      const maskImageData = maskCtx.getImageData(0, 0, brushMaskCanvas.width, brushMaskCanvas.height)
      // Scale mask coordinates from canvas space to target space
      const maskScaleX = brushMaskCanvas.width / targetWidth
      const maskScaleY = brushMaskCanvas.height / targetHeight
      brushMaskData = new Uint8ClampedArray(targetWidth * targetHeight)
      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const maskX = Math.floor(x * maskScaleX)
          const maskY = Math.floor(y * maskScaleY)
          const maskI = (maskY * brushMaskCanvas.width + maskX) * 4
          // White pixels in brush mask = selected (255) = use reference pixel
          brushMaskData[y * targetWidth + x] = maskImageData.data[maskI]
        }
      }
    }
  }

  const featherPx = options.featherPx ?? clamp(Math.round(Math.min(targetWidth, targetHeight) * 0.08), 6, 20)
  const toneMatchStrength = clamp(options.toneMatchStrength ?? 0.72, 0, 1)

  const sourceStats = collectReferenceStats(refData.data)
  const targetStats = collectSurroundingStats(
    fullBaseData.data,
    canvas.width,
    canvas.height,
    { x: targetX, y: targetY, width: targetWidth, height: targetHeight },
    clamp(Math.round(Math.max(targetWidth, targetHeight) * 0.16), 12, 48)
  )

  // Use brush mask data for feather mask when available, otherwise fall back to reference alpha
  const maskDataForFeather = brushMaskData || refData.data
  const mask = buildAlphaAwareFeatherMask(maskDataForFeather, targetWidth, targetHeight, featherPx)
  const scaleR = sourceStats.count > 0 && targetStats.count > 0 ? clamp(targetStats.r / Math.max(1, sourceStats.r), 0.78, 1.22) : 1
  const scaleG = sourceStats.count > 0 && targetStats.count > 0 ? clamp(targetStats.g / Math.max(1, sourceStats.g), 0.78, 1.22) : 1
  const scaleB = sourceStats.count > 0 && targetStats.count > 0 ? clamp(targetStats.b / Math.max(1, sourceStats.b), 0.78, 1.22) : 1
  const lumaShift = sourceStats.count > 0 && targetStats.count > 0
    ? clamp(targetStats.luma - sourceStats.luma, -18, 18)
    : 0

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const pixelIndex = (y * targetWidth + x) * 4
      // Use brush mask alpha when available, otherwise reference image alpha
      const alpha = brushMaskData ? brushMaskData[y * targetWidth + x] / 255 : refData.data[pixelIndex + 3] / 255
      if (alpha < 0.02) continue

      const contourOpacity = mask[y * targetWidth + x] / 255
      const edgeFactor = 1 - smoothstep(0.86, 1, contourOpacity)
      const correctionStrength = toneMatchStrength * lerp(0.35, 1, edgeFactor)

      const baseR = baseData.data[pixelIndex]
      const baseG = baseData.data[pixelIndex + 1]
      const baseB = baseData.data[pixelIndex + 2]

      const originalR = refData.data[pixelIndex]
      const originalG = refData.data[pixelIndex + 1]
      const originalB = refData.data[pixelIndex + 2]

      const scaledR = clamp(originalR * scaleR + lumaShift, 0, 255)
      const scaledG = clamp(originalG * scaleG + lumaShift, 0, 255)
      const scaledB = clamp(originalB * scaleB + lumaShift, 0, 255)

      let fusedR = lerp(originalR, scaledR, correctionStrength)
      let fusedG = lerp(originalG, scaledG, correctionStrength)
      let fusedB = lerp(originalB, scaledB, correctionStrength)

      const edgeTintStrength = edgeFactor * 0.12
      fusedR = lerp(fusedR, baseR, edgeTintStrength)
      fusedG = lerp(fusedG, baseG, edgeTintStrength)
      fusedB = lerp(fusedB, baseB, edgeTintStrength)

      const localBlend = contourOpacity

      refData.data[pixelIndex] = Math.round(fusedR * localBlend + baseR * (1 - localBlend))
      refData.data[pixelIndex + 1] = Math.round(fusedG * localBlend + baseG * (1 - localBlend))
      refData.data[pixelIndex + 2] = Math.round(fusedB * localBlend + baseB * (1 - localBlend))
      refData.data[pixelIndex + 3] = 255
    }
  }

  refCtx.putImageData(refData, 0, 0)
  ctx.drawImage(refCanvas, targetX, targetY)

  return canvas.toDataURL("image/png")
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
  maskCoordinates: { x: number; y: number; width: number; height: number },
  brushMaskCanvas?: HTMLCanvasElement,
  options?: LocalFusionOptions
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
  // Scale full mask to base image dimensions with edge feathering
  const fullMaskCanvas = document.createElement("canvas")
  fullMaskCanvas.width = baseImg.width
  fullMaskCanvas.height = baseImg.height
  const fullMaskCtx = fullMaskCanvas.getContext("2d")
  if (!fullMaskCtx) throw new Error("Failed to get full mask canvas context")
  // Proportional blur: larger images need more blur to achieve the same perceptual softness
  const blurPx = Math.max(3, Math.min(8, Math.round(Math.min(baseImg.width, baseImg.height) / 150)))
  fullMaskCtx.filter = `blur(${blurPx}px)`
  fullMaskCtx.drawImage(maskImg, 0, 0, baseImg.width, baseImg.height)
  fullMaskCtx.filter = "none"

  // Scale reference image to fit target region
  const refCanvas = document.createElement("canvas")
  refCanvas.width = targetWidth
  refCanvas.height = targetHeight
  const refCtx = refCanvas.getContext("2d")
  if (!refCtx) throw new Error("Failed to get ref canvas context")

  const sourceCanvas = document.createElement("canvas")
  sourceCanvas.width = refImg.width
  sourceCanvas.height = refImg.height
  const sourceCtx = sourceCanvas.getContext("2d")
  if (!sourceCtx) throw new Error("Failed to get source canvas context")
  sourceCtx.drawImage(refImg, 0, 0)
  const sourceImageData = sourceCtx.getImageData(0, 0, refImg.width, refImg.height)
  const opaqueBounds = findOpaqueBounds(sourceImageData.data, refImg.width, refImg.height)

  if (opaqueBounds) {
    // Always stretch the opaque subject to exactly fill the target.
    // Whether the element has transparent edges (post bg-removal) or not,
    // the visible content must fill the entire selected region — no letterboxing.
    refCtx.drawImage(
      refImg,
      opaqueBounds.srcX,
      opaqueBounds.srcY,
      opaqueBounds.srcWidth,
      opaqueBounds.srcHeight,
      0,
      0,
      targetWidth,
      targetHeight
    )
  } else {
    // No opaque pixels at all — stretch the whole image
    refCtx.drawImage(refImg, 0, 0, refImg.width, refImg.height, 0, 0, targetWidth, targetHeight)
  }

  // Pixel-by-pixel blend: combinedAlpha = maskBrightness × refAlpha × blendStrength
  const blendStrength = clamp(options?.blendStrength ?? 1.0, 0, 1)
  const maskData = fullMaskCtx.getImageData(targetX, targetY, targetWidth, targetHeight)
  const refData = refCtx.getImageData(0, 0, targetWidth, targetHeight)
  const baseData = ctx.getImageData(targetX, targetY, targetWidth, targetHeight)

  for (let i = 0; i < maskData.data.length; i += 4) {
    const maskBrightness = (maskData.data[i] + maskData.data[i + 1] + maskData.data[i + 2]) / 3
    const refAlpha = refData.data[i + 3] / 255
    const combinedAlpha = (maskBrightness / 255) * refAlpha * blendStrength
    if (combinedAlpha > 0.01) {
      baseData.data[i] = Math.round(refData.data[i] * combinedAlpha + baseData.data[i] * (1 - combinedAlpha))
      baseData.data[i + 1] = Math.round(refData.data[i + 1] * combinedAlpha + baseData.data[i + 1] * (1 - combinedAlpha))
      baseData.data[i + 2] = Math.round(refData.data[i + 2] * combinedAlpha + baseData.data[i + 2] * (1 - combinedAlpha))
      baseData.data[i + 3] = 255
    }
  }

  ctx.putImageData(baseData, targetX, targetY)
  return canvas.toDataURL("image/png")
}

export async function compositePatchWithLocalFusion(
  baseImageUrl: string,
  referenceImageUrl: string,
  placement: PatchPlacement,
  options?: LocalFusionOptions
): Promise<string> {
  return compositePatchOnBase(baseImageUrl, referenceImageUrl, placement, options)
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

/**
 * Client-side white background matte removal.
 * Used as a fallback when Replicate bg-removal fails for images with a plain white background.
 * Detects a white background by sampling the image edges; if found, fades white-ish pixels
 * to transparent so they don't bleed into the composite.
 */
export async function removeWhiteMatteIfNeeded(imageDataUrl: string, threshold = 232): Promise<string> {
  const img = await loadImage(imageDataUrl)
  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return imageDataUrl

  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const data = imageData.data

  // Sample points along all four edges to detect white background
  const samplePoints: [number, number][] = [
    [0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1],
    [Math.floor(img.width / 2), 0], [Math.floor(img.width / 2), img.height - 1],
    [0, Math.floor(img.height / 2)], [img.width - 1, Math.floor(img.height / 2)],
  ]

  let whiteCount = 0
  for (const [x, y] of samplePoints) {
    const i = (y * img.width + x) * 4
    if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold && data[i + 3] >= 200) {
      whiteCount++
    }
  }

  // Need at least 5 of 8 edge samples to be white before applying removal
  if (whiteCount < 5) return imageDataUrl

  console.log(`[WhiteMatte] Detected white background (${whiteCount}/8 edge samples) — applying local removal`)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue
    const minChannel = Math.min(data[i], data[i + 1], data[i + 2])
    if (minChannel >= threshold) {
      const whiteness = (minChannel - threshold) / (255 - threshold)
      data[i + 3] = Math.round(data[i + 3] * Math.max(0, 1 - whiteness * 1.6))
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL("image/png")
}
