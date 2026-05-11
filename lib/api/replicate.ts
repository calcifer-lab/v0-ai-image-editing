/**
 * Replicate API 共享工具函数 (sharp-free).
 *
 * Mask resize (the only sharp-using helper) lives in ./resize-mask so that
 * routes which only need polling / validation utilities don't bundle sharp.
 */

import type { ReplicatePredictionResult, ImageDimensions } from "@/types"

// Re-export validation utilities so existing import paths (`@/lib/api`) keep working.
export {
  validateImageDataUrl,
  isValidImage,
  estimateBase64DecodedBytes,
  type ValidatedImageInput,
  type ImageValidationOptions,
} from "./validate"

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
 * 从 Replicate 预测结果中提取输出 URL
 */
export function extractOutputUrl(output: string | string[] | undefined): string | null {
  if (!output) return null
  return Array.isArray(output) ? output[0] : output
}
