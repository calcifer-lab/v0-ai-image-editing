/**
 * Replicate API 共享工具函数
 */

import type { ReplicatePredictionResult, ImageDimensions } from "@/types"

const IMAGE_DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/

export interface ValidatedImageInput {
  dataUrl: string
  mimeType: string
  bytes: number
}

export interface ImageValidationOptions {
  fieldName?: string
  maxBytes?: number
}

/**
 * 轮询 Replicate 预测结果
 */
export async function pollReplicatePrediction(
  predictionUrl: string,
  apiKey: string,
  maxAttempts = 120,
  intervalMs = 2000
): Promise<ReplicatePredictionResult> {
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
    console.log(`[Replicate] Poll ${i + 1}/${maxAttempts}: status = ${prediction.status}`)

    if (prediction.status === "succeeded") {
      return prediction
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      // 输出更详细的错误信息
      console.error(`[Replicate] Prediction ${prediction.status}:`, JSON.stringify(prediction, null, 2))
      const errorMsg = prediction.error || prediction.logs || "Prediction failed"
      return { status: prediction.status, error: errorMsg }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Prediction timed out")
}

/**
 * 从 URL 获取图片并转换为 base64
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const contentType = response.headers.get("content-type") || "image/png"
  return `data:${contentType};base64,${base64}`
}

/**
 * 验证图片格式是否有效
 */
export function isValidImage(base64: string): boolean {
  return base64.startsWith("data:image/")
}

export function estimateBase64DecodedBytes(base64Payload: string): number {
  const normalized = base64Payload.replace(/\s/g, "")
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

export function validateImageDataUrl(
  value: string,
  options: ImageValidationOptions = {}
): { ok: true; image: ValidatedImageInput } | { ok: false; error: string; status: number } {
  const fieldName = options.fieldName || "image"

  if (!value || typeof value !== "string") {
    return { ok: false, error: `${fieldName} is required`, status: 400 }
  }

  const trimmed = value.trim()
  const match = trimmed.match(IMAGE_DATA_URL_REGEX)
  if (!match) {
    return {
      ok: false,
      error: `${fieldName} must be a valid base64 data URL (for example data:image/png;base64,...)`,
      status: 400,
    }
  }

  const [, mimeType, base64Payload] = match
  const bytes = estimateBase64DecodedBytes(base64Payload)

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { ok: false, error: `${fieldName} could not be decoded`, status: 400 }
  }

  if (options.maxBytes && bytes > options.maxBytes) {
    const maxMb = (options.maxBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")
    return {
      ok: false,
      error: `${fieldName} is too large. Maximum supported size is ${maxMb}MB.`,
      status: 413,
    }
  }

  return {
    ok: true,
    image: {
      dataUrl: trimmed,
      mimeType,
      bytes,
    },
  }
}

/**
 * 从 base64 获取图片尺寸
 */
export async function getImageDimensions(base64: string): Promise<ImageDimensions> {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")
  
  // Check for PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  }
  
  // Check for JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height }
      }
      const length = buffer.readUInt16BE(offset + 2)
      offset += 2 + length
    }
  }
  
  // Default fallback
  return { width: 512, height: 512 }
}

/**
 * 使用 sharp 调整遮罩尺寸以匹配图片
 */
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

/**
 * 从 Replicate 预测结果中提取输出 URL
 */
export function extractOutputUrl(output: string | string[] | undefined): string | null {
  if (!output) return null
  return Array.isArray(output) ? output[0] : output
}
