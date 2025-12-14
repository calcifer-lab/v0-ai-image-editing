/**
 * 统一的编辑器类型定义
 */

// ============ 编辑器步骤和模式 ============
export type EditorStep = "upload" | "edit" | "result"
export type EditMode = "ai" | "composite"

// ============ 图像数据 ============
export interface ImageData {
  elementImage: string | null
  baseImage: string | null
}

export interface MaskData {
  dataUrl: string
  coordinates: MaskCoordinates
}

export interface MaskCoordinates {
  x: number
  y: number
  width: number
  height: number
}

// ============ 输出尺寸配置 ============
export type AspectRatio = "original" | "1:1" | "4:3" | "16:9" | "3:2" | "9:16" | "custom"
export type ScaleMode = "fit" | "fill" | "stretch"

export interface OutputDimensions {
  aspectRatio: AspectRatio
  scaleMode: ScaleMode
  customWidth?: number
  customHeight?: number
}

// ============ 编辑参数 ============
export interface EditParams {
  prompt: string
  strength: number
  guidance: number
  preserveStructure: boolean
  outputDimensions: OutputDimensions
  editMode: EditMode
}

// ============ 裁剪区域 ============
export interface CropRegion {
  x: number
  y: number
  width: number
  height: number
  imageWidth: number
  imageHeight: number
}

// ============ 编辑器状态 ============
export interface EditorState {
  step: EditorStep
  images: ImageData
  mask: MaskData | null
  params: EditParams
  resultImage: string | null
  isProcessing: boolean
  processingStatus: string
  error: string | null
  imageAnalysis: string | null
  isAnalyzing: boolean
  elementCrop: CropRegion | null
}

// ============ 默认值 ============
export const DEFAULT_EDIT_PARAMS: EditParams = {
  prompt: "",
  strength: 0.8,
  guidance: 7.5,
  preserveStructure: true,
  outputDimensions: {
    aspectRatio: "original",
    scaleMode: "fit",
  },
  editMode: "ai",
}

export const DEFAULT_EDITOR_STATE: EditorState = {
  step: "upload",
  images: { elementImage: null, baseImage: null },
  mask: null,
  params: DEFAULT_EDIT_PARAMS,
  resultImage: null,
  isProcessing: false,
  processingStatus: "",
  error: null,
  imageAnalysis: null,
  isAnalyzing: false,
  elementCrop: null,
}
