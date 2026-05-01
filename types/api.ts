/**
 * API 相关类型定义
 */

// ============ Inpaint API ============
export interface InpaintRequest {
  base_image: string
  mask_image: string
  reference_image?: string
  prompt: string
  options?: InpaintOptions
}

export interface InpaintOptions {
  strength?: number
  steps?: number
  guidance_scale?: number
}

export interface InpaintResponse {
  result_image: string
  meta: {
    model: string
    duration_ms: number
    reference_used?: boolean
  }
}

// ============ Analyze Image API ============
export interface AnalyzeImageRequest {
  image: string
  prompt?: string
}

export interface AnalyzeImageResponse {
  analysis: string
  meta: {
    model: string
    usage?: unknown
  }
}

// ============ Remove Background API ============
export interface RemoveBackgroundRequest {
  image: string
}

export interface RemoveBackgroundResponse {
  result_image: string
  meta: {
    model: string
    duration_ms: number
  }
}

// ============ Replicate 预测结果 ============
export interface ReplicatePredictionResult {
  status: string
  output?: string | string[]
  error?: string
}

// ============ API 错误响应 ============
export interface ApiErrorResponse {
  error: string
}

// ============ 图像尺寸 ============
export interface ImageDimensions {
  width: number
  height: number
}
