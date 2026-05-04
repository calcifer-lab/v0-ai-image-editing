/**
 * API 相关类型定义
 */

// ============ Inpaint API ============
export interface MaskBboxNorm {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface InpaintRequest {
  base_image: string
  mask_image: string
  reference_image?: string
  /** Local pre-composited preview anchoring element placement (composite-first AI Compose). */
  composite_image?: string
  /** Element analysis text from /api/analyze-image, injected into the model prompt. */
  element_analysis?: string
  /** Normalized bbox of the white mask region (in base image coords). */
  mask_bbox_norm?: MaskBboxNorm
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
    /** True when reference_image was provided but the serving model could not consume it (e.g. FLUX fallback). */
    reference_dropped?: boolean
    /** True when composite_image was provided and used as the placement anchor. */
    composite_used?: boolean
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
