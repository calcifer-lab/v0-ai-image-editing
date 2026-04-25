"use client"

import { useState, useCallback, useRef } from "react"
import type {
  EditorStep,
  ImageData,
  MaskData,
  EditParams,
  CropRegion,
  DEFAULT_EDIT_PARAMS,
} from "@/types"
import { resizeToAspectRatio, compositeImages, loadImage, resizeImage, compressImage } from "@/lib/image-utils"
import { resizeImage as resizeImageBlob } from "@/utils/imageResize"
import { safeParseJSON } from "@/utils/safeParse"

// ============ 初始状态 ============
const INITIAL_IMAGES: ImageData = {
  elementImage: null,
  baseImage: null,
}

const INITIAL_PARAMS: EditParams = {
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

// ============ Hook 返回类型 ============
export interface UseImageEditorReturn {
  // 状态
  step: EditorStep
  images: ImageData
  mask: MaskData | null
  params: EditParams
  resultImage: string | null
  isProcessing: boolean
  processingStatus: string
  processingProgress: number // 0-100 百分比
  error: string | null
  imageAnalysis: string | null
  isAnalyzing: boolean
  elementCrop: CropRegion | null

  // 操作方法
  setStep: (step: EditorStep) => void
  setParams: (params: EditParams) => void
  setMask: (mask: MaskData | null) => void
  setElementCrop: (crop: CropRegion | null) => void
  handleImagesUploaded: (elementImg: string, baseImg: string) => Promise<void>
  handleProcess: () => Promise<void>
  handleReset: () => void
}

// ============ 辅助函数 ============
async function cropImageToDataUrl(imageUrl: string, crop: CropRegion): Promise<string> {
  const img = await loadImage(imageUrl)

  // Guard against stale crops that do not match the current image
  const safeWidth = Math.min(crop.width, crop.imageWidth)
  const safeHeight = Math.min(crop.height, crop.imageHeight)
  const safeX = Math.min(Math.max(crop.x, 0), Math.max(0, crop.imageWidth - safeWidth))
  const safeY = Math.min(Math.max(crop.y, 0), Math.max(0, crop.imageHeight - safeHeight))

  const canvas = document.createElement("canvas")
  canvas.width = safeWidth
  canvas.height = safeHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context for crop")

  ctx.drawImage(
    img,
    safeX,
    safeY,
    safeWidth,
    safeHeight,
    0,
    0,
    safeWidth,
    safeHeight
  )

  return canvas.toDataURL("image/png")
}

/**
 * Scale mask coordinates from one image dimensions to another.
 * Used when the mask was drawn at original canvas size but we need to
 * apply it at a different (resized) canvas size.
 */
function scaleMaskCoordinates(
  coords: { x: number; y: number; width: number; height: number },
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number
): { x: number; y: number; width: number; height: number } {
  const scaleX = toWidth / fromWidth
  const scaleY = toHeight / fromHeight
  return {
    x: Math.round(coords.x * scaleX),
    y: Math.round(coords.y * scaleY),
    width: Math.round(coords.width * scaleX),
    height: Math.round(coords.height * scaleY),
  }
}

/**
 * Composite the reference element (with background removed) directly onto
 * the base canvas at the masked position — pixel-level replacement BEFORE
 * sending to AI. This ensures the reference pixels are actually preserved
 * in the output, rather than being used only as a "style hint".
 *
 * The AI then only needs to blend edges, not regenerate content.
 */
async function compositeElementPixelPerfect(
  baseWithHole: string,   // base with masked region already cleared (transparent)
  croppedReference: string, // reference element, background already removed
  originalMaskCoords: { x: number; y: number; width: number; height: number },
  originalImageWidth: number,
  originalImageHeight: number,
  resizedWidth: number,
  resizedHeight: number
): Promise<string> {
  const [baseImg, refImg] = await Promise.all([
    loadImage(baseWithHole),
    loadImage(croppedReference),
  ])

  // Scale the mask placement coordinates from original → resized canvas
  const scaled = scaleMaskCoordinates(
    originalMaskCoords,
    originalImageWidth,
    originalImageHeight,
    resizedWidth,
    resizedHeight
  )

  const canvas = document.createElement("canvas")
  canvas.width = resizedWidth
  canvas.height = resizedHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context for composite")

  // Draw base (with hole) first
  ctx.drawImage(baseImg, 0, 0, resizedWidth, resizedHeight)

  // Draw the reference element into the masked hole
  // Use 'source-over' to place ref pixels directly into the hole
  ctx.drawImage(
    refImg,
    0, 0, refImg.width, refImg.height,  // source rect (full reference)
    scaled.x, scaled.y, scaled.width, scaled.height // dest rect (mask position)
  )

  console.log("[AI Editor] Pixel-perfect composite: ref", refImg.width, "x", refImg.height,
    "→ placed at canvas pos", scaled.x, scaled.y, "size", scaled.width, "x", scaled.height)

  return canvas.toDataURL("image/png")
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function removeMaskedRegionFromBase(baseDataUrl: string, maskDataUrl: string): Promise<string> {
  const [baseImg, maskImg] = await Promise.all([loadImage(baseDataUrl), loadImage(maskDataUrl)])

  const canvas = document.createElement("canvas")
  canvas.width = baseImg.width
  canvas.height = baseImg.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context for base masking")

  // ── Draw base at full resolution ───────────────────────────────────────
  ctx.drawImage(baseImg, 0, 0, baseImg.width, baseImg.height)

  // ── Build correct mask for the base ────────────────────────────────────
  // Problem: maskCanvas and baseCanvas have SAME aspect ratio (both match
  // original image). For portrait images: baseCanvas=450×600, base=1536×1152.
  // The brush was painted at canvas coords; to cut the hole at the CORRECT
  // position in the base, we must:
  //   1. Draw the mask (with hole) at maskCanvas's native resolution
  //   2. Scale it proportionally to cover the base canvas
  //   3. The scaled hole position = canvas position × (base/maskCanvas) scale
  //
  // Step 1: create mask WITH HOLE at mask canvas resolution
  //   hole = "not-selected" pixels of mask, on a white ("selected") background
  const holeMask = document.createElement("canvas")
  holeMask.width = maskImg.width
  holeMask.height = maskImg.height
  const holeCtx = holeMask.getContext("2d")
  if (!holeCtx) throw new Error("Failed to get hole mask context")

  // White base = entire region is "selected" (to be made transparent)
  holeCtx.fillStyle = "white"
  holeCtx.fillRect(0, 0, maskImg.width, maskImg.height)

  // Cut the painted region (black/not-selected = keep) out of the white base
  holeCtx.globalCompositeOperation = "destination-out"
  holeCtx.drawImage(maskImg, 0, 0) // maskImg has black painted pixels
  holeCtx.globalCompositeOperation = "source-over"
  // Now holeMask has: hole (transparent) = painted brush, white = rest

  // Step 2: proportional scale of holeMask to cover base canvas
  const scaleX = baseImg.width / maskImg.width
  const scaleY = baseImg.height / maskImg.height
  const scaledW = Math.round(maskImg.width * scaleX)
  const scaledH = Math.round(maskImg.height * scaleY)
  const scaledMask = document.createElement("canvas")
  scaledMask.width = scaledW
  scaledMask.height = scaledH
  const smCtx = scaledMask.getContext("2d")
  if (!smCtx) throw new Error("Failed to get scaled mask context")
  smCtx.drawImage(holeMask, 0, 0, scaledW, scaledH)
  // scaledMask: hole region correctly scaled to base resolution

  // Step 3: cut the hole in base using the correctly scaled mask
  ctx.globalCompositeOperation = "destination-out"
  ctx.drawImage(scaledMask, 0, 0, baseImg.width, baseImg.height)
  ctx.globalCompositeOperation = "source-over"

  return canvas.toDataURL("image/png")
}

function buildPromptFromAnalysis(imageAnalysis: string): string {
  // 首先检测是否为裁剪区域分析格式 (新格式 - 带层级结构)
  const selectedElementMatch = imageAnalysis.match(/Selected Element[^:]*:?\s*([^\n]+)/i)
  
  if (selectedElementMatch) {
    // 新格式：裁剪区域分析
    const selectedElement = selectedElementMatch[1].replace(/\*+/g, "").trim()
    
    // 提取 Layer Structure（新增的层级结构）
    const layerStructureMatch = imageAnalysis.match(/Layer Structure[^:]*:?\s*([\s\S]*?)(?=\*\*Spatial|\*\*Visual|\*\*Style|$)/i)
    const layers: string[] = []
    if (layerStructureMatch) {
      const layerText = layerStructureMatch[1]
      const layerLines = layerText.split('\n').filter(l => l.trim().match(/Layer\s*\d|Top|Bottom/i))
      layerLines.forEach(line => {
        const cleaned = line.replace(/^[-\s*]+/, '').replace(/\*+/g, '').trim()
        if (cleaned) layers.push(cleaned)
      })
    }
    
    // 提取 Spatial Relationships（空间关系）
    const spatialMatch = imageAnalysis.match(/Spatial Relationships[^:]*:?\s*([\s\S]*?)(?=\*\*Visual|\*\*Style|$)/i)
    const spatialRelations = spatialMatch 
      ? spatialMatch[1].replace(/\*+/g, "").trim().split('\n').filter(l => l.trim()).slice(0, 3).join('; ')
      : ""
    
    // 提取 Key Structural Details
    const keyDetailsMatch = imageAnalysis.match(/Key Structural Details[^:]*:?\s*([\s\S]*?)(?=\*\*|$)/i)
      || imageAnalysis.match(/Key Details[^:]*:?\s*([\s\S]*?)(?=\*\*|$)/i)
    const keyDetails = keyDetailsMatch 
      ? keyDetailsMatch[1].replace(/\*+/g, "").trim().split('\n').filter(l => l.trim()).slice(0, 3).join('; ')
      : ""
    
    // 提取 Style
    const styleMatch = imageAnalysis.match(/Style[^:]*:?\s*([^\n]+)/i)
    const style = styleMatch ? styleMatch[1].replace(/\*+/g, "").trim() : ""
    
    // 构建包含层级结构的提示词
    let finalPrompt = `COPY EXACTLY the ${selectedElement} from the reference image into the masked region. `
    
    // 添加层级结构描述
    if (layers.length > 0) {
      finalPrompt += `STRUCTURE (from top to bottom): ${layers.join(' → ')}. `
    }
    
    // 添加空间关系
    if (spatialRelations) {
      finalPrompt += `Relationships: ${spatialRelations}. `
    }
    
    if (keyDetails) {
      finalPrompt += `Key details: ${keyDetails}. `
    }
    if (style) {
      finalPrompt += `Match the ${style} style. `
    }
    finalPrompt += `PRESERVE the exact layer structure and spatial relationships. DO NOT invent new objects.`
    
    return finalPrompt
  }
  
  // 旧格式：完整图片分析
  let keyElements = ""
  let specialItems = ""
  
  // Try to extract "Key Elements to Preserve" section
  const keyElementsMatch = imageAnalysis.match(/Key Elements[^:]*:?\s*([\s\S]*?)(?=\*\*|$)/i)
  if (keyElementsMatch) {
    keyElements = keyElementsMatch[1].replace(/\*+/g, "").trim().split('\n').slice(0, 3).join('; ')
  }
  
  // Try to extract "Special Items" section
  const specialItemsMatch = imageAnalysis.match(/SPECIAL ITEMS[^:]*:?\s*([^\n]+)/i)
  if (specialItemsMatch) {
    specialItems = specialItemsMatch[1].replace(/\*+/g, "").trim()
  }
  
  // Try to extract "LEGS/FEET" section
  const feetMatch = imageAnalysis.match(/LEGS\/FEET[^:]*:?\s*([^\n]+)/i)
  const feetDescription = feetMatch ? feetMatch[1].replace(/\*+/g, "").trim() : ""
  
  // Build comprehensive prompt
  let finalPrompt = `COPY EXACTLY what you see in the reference image for the masked region. `
  if (specialItems) {
    finalPrompt += `The reference shows: ${specialItems}. `
  }
  if (feetDescription) {
    finalPrompt += `Under the feet: ${feetDescription}. `
  }
  if (keyElements) {
    finalPrompt += `Key elements to copy: ${keyElements}. `
  }
  finalPrompt += `DO NOT invent new objects. DO NOT create random decorations. Copy the EXACT visual elements from the reference image.`
  
  return finalPrompt
}

// Compress large data URLs before network upload to stay under server limits
async function compressDataUrlForUpload(imageDataUrl: string): Promise<string> {
  try {
    const { dataUrl } = await resizeImage(imageDataUrl, 1536, 1536)
    return await compressImage(dataUrl, 0.85)
  } catch (error) {
    console.warn("[AI Editor] Image compression failed, using original", error)
    return imageDataUrl
  }
}

// ============ Hook 实现 ============
export function useImageEditor(): UseImageEditorReturn {
  const [step, setStep] = useState<EditorStep>("upload")
  const [images, setImages] = useState<ImageData>(INITIAL_IMAGES)
  const [mask, setMask] = useState<MaskData | null>(null)
  const [params, setParams] = useState<EditParams>(INITIAL_PARAMS)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [elementCrop, setElementCrop] = useState<CropRegion | null>(null)
  const progressDriftTimer = useRef<number | null>(null)

  const stopProgressDrift = useCallback(() => {
    if (progressDriftTimer.current !== null) {
      clearInterval(progressDriftTimer.current)
      progressDriftTimer.current = null
    }
  }, [])

  const startProgressDrift = useCallback(
    (target: number) => {
      stopProgressDrift()
      progressDriftTimer.current = window.setInterval(() => {
        setProcessingProgress((prev) => {
          const next = Math.min(prev + 1, target - 1)
          if (next >= target - 1) {
            stopProgressDrift()
          }
          return next
        })
      }, 500)
    },
    [stopProgressDrift]
  )

  // 辅助函数：更新处理状态和进度
  const updateProgress = useCallback(
    (status: string, progress: number, options?: { driftTo?: number }) => {
      setProcessingStatus(status)
      setProcessingProgress(progress)

      stopProgressDrift()
      if (options?.driftTo && options.driftTo > progress) {
        startProgressDrift(options.driftTo)
      }
    },
    [startProgressDrift, stopProgressDrift]
  )

  // 分析图片 - 支持传入裁剪区域以聚焦分析
  // 返回分析结果字符串，以便调用者可以立即使用（避免闭包捕获的状态值过时问题）
  const analyzeImage = useCallback(async (elementImg: string, crop?: CropRegion | null): Promise<string | null> => {
    setIsAnalyzing(true)
    try {
      // 如果有裁剪区域，先裁剪图片再分析
      let imageToAnalyze = elementImg
      let useCroppedPrompt = false
      
      if (crop && crop.width > 0 && crop.height > 0) {
        try {
          imageToAnalyze = await cropImageToDataUrl(elementImg, crop)
          useCroppedPrompt = true
          console.log("[AI Editor] Analyzing cropped region:", crop.width, "x", crop.height)
        } catch (cropError) {
          console.warn("[AI Editor] Failed to crop for analysis, using original image:", cropError)
        }
      }

      // 根据是否裁剪选择不同的提示词
      const { CROPPED_REGION_ANALYSIS_PROMPT, IMAGE_ANALYSIS_PROMPT } = await import("@/lib/api/prompts")
      const analysisPrompt = useCroppedPrompt ? CROPPED_REGION_ANALYSIS_PROMPT : IMAGE_ANALYSIS_PROMPT

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: imageToAnalyze,
          prompt: analysisPrompt 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setImageAnalysis(data.analysis)
        console.log("[AI Editor] Image analysis complete:", data.analysis)
        return data.analysis
      } else {
        console.warn("[AI Editor] Image analysis failed, continuing without analysis")
        setImageAnalysis(null)
        return null
      }
    } catch (err) {
      console.warn("[AI Editor] Image analysis error:", err)
      setImageAnalysis(null)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // 处理图片上传
  const handleImagesUploaded = useCallback(async (elementImg: string, baseImg: string) => {
    console.log("[AI Editor] Images uploaded")
    setImages({ elementImage: elementImg, baseImage: baseImg })
    setElementCrop(null)
    setError(null)
    setStep("edit")
    // Image analysis is now deferred until Generate button is clicked
  }, [])

  // 处理遮罩创建
  const handleMaskCreated = useCallback((maskData: MaskData | null) => {
    setMask(maskData)
  }, [])

  // 处理直接合成模式（带 AI 融合）
  const processCompositeMode = useCallback(async (): Promise<string> => {
    if (!images.baseImage || !images.elementImage || !mask) {
      throw new Error("Missing required images or mask")
    }

    console.log("[AI Editor] Using Direct Patch mode with AI fusion")

    // 裁剪参考图片 (10%)
    updateProgress("Preparing reference image...", 10)
    const hasExplicitCrop = !!(elementCrop && elementCrop.width > 0 && elementCrop.height > 0)

    let processedReference = images.elementImage
    if (hasExplicitCrop && elementCrop) {
      try {
        processedReference = await cropImageToDataUrl(images.elementImage, elementCrop)
        console.log("[AI Editor] Applied user crop to reference image")
      } catch (cropError) {
        console.warn("[AI Editor] Failed to crop reference image, using original", cropError)
      }
    }

    // 移除背景 (25%)
    updateProgress("Removing background...", 25)
    try {
      const bgResponse = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: processedReference }),
      })

      if (bgResponse.ok) {
        const bgData = await bgResponse.json()
        if (bgData.result_image) {
          processedReference = bgData.result_image
          console.log("[AI Editor] Background removed successfully")
        }
      } else {
        console.warn("[AI Editor] Background removal failed, using original image")
      }
    } catch (bgError) {
      console.warn("[AI Editor] Background removal error:", bgError)
    }

    // 合成图片 (40%)
    updateProgress("Patching element into image...", 40)
    const compositeResult = await compositeImages(
      images.baseImage,
      processedReference,
      mask.dataUrl,
      mask.coordinates
    )

    console.log("[AI Editor] Composite complete, starting AI fusion...")

    // AI 融合后处理 (60%)
    updateProgress("AI fusion: Harmonizing lighting and style...", 60, { driftTo: 78 })
    try {
      const [compressedComposite, compressedBase, compressedReference] = await Promise.all([
        compressDataUrlForUpload(compositeResult),
        compressDataUrlForUpload(images.baseImage),
        compressDataUrlForUpload(processedReference),
      ])

      const fusionResponse = await fetch("/api/fusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composite_image: compressedComposite,
          original_base: compressedBase,
          reference_image: compressedReference,
          mask_region: mask.coordinates,
        }),
      })

      if (fusionResponse.ok) {
        const fusionData = await fusionResponse.json()
        if (fusionData.fused_image) {
          console.log("[AI Editor] AI fusion complete:", fusionData.meta.model)
          return fusionData.fused_image
        }
      } else {
        console.warn("[AI Editor] AI fusion failed, using composite result")
      }
    } catch (fusionError) {
      console.warn("[AI Editor] AI fusion error:", fusionError)
    }

    // 如果融合失败，返回合成结果
    console.log("[AI Editor] Direct Patch complete (no fusion)")
    return compositeResult
  }, [images, mask, elementCrop])

  // 处理 AI 生成模式
  const processAIMode = useCallback(async (): Promise<string> => {
    if (!images.baseImage || !images.elementImage || !mask) {
      throw new Error("Missing required images or mask")
    }

    updateProgress("Compressing images for upload...", 12, { driftTo: 18 })

    // Downscale inputs to avoid oversized payloads before calling inpaint
    const hasExplicitCrop = !!(elementCrop && elementCrop.width > 0 && elementCrop.height > 0)

    const [baseBlob, maskBlob] = await Promise.all([
      dataUrlToBlob(images.baseImage),
      dataUrlToBlob(mask.dataUrl),
    ])

    const [compressedBase, compressedMask] = await Promise.all([
      resizeImageBlob(baseBlob, 1536, 0.85),
      // Keep mask aligned to the same dimensions as the base to avoid misalignment
      resizeImageBlob(maskBlob, 1536, 0.95),
    ])

    let processedBaseImage = await blobToDataUrl(compressedBase)
    const processedMaskImage = await blobToDataUrl(compressedMask)

    updateProgress("Cleaning masked region...", 20, { driftTo: 28 })
    // Remove masked region from the base so the model is forced to replace it
    processedBaseImage = await removeMaskedRegionFromBase(processedBaseImage, processedMaskImage)

    // 使用局部变量跟踪分析结果，避免闭包捕获的状态值过时问题
    // 关键：只有当 (1) 已有分析 AND (2) 没有新的 elementCrop AND (3) 没有自定义 prompt 时才复用
    const hasNewCrop = elementCrop && elementCrop.width > 0 && elementCrop.height > 0
    let currentAnalysis = (!hasNewCrop && !params.prompt.trim()) ? imageAnalysis : null

    // 当有新裁剪区域或无分析结果时，重新分析当前选中的区域
    if (!currentAnalysis && !params.prompt.trim()) {
      updateProgress("Analyzing selected element region...", 28, { driftTo: 36 })
      const freshAnalysis = await analyzeImage(images.elementImage, elementCrop)
      // 立即使用新鲜的分析结果
      currentAnalysis = freshAnalysis
      // 分析完成后同步到状态（供下次使用）
      if (freshAnalysis) {
        setImageAnalysis(freshAnalysis)
      }
    }

    // 裁剪参考图片（如果用户有选择裁剪区域）
    updateProgress("Preparing reference image...", 38, { driftTo: 44 })
    let processedReference: string
    if (hasExplicitCrop && elementCrop) {
      try {
        const croppedReference = await cropImageToDataUrl(images.elementImage, elementCrop)
        const resizedReference = await resizeImage(croppedReference, 768, 768)
        processedReference = await compressImage(resizedReference.dataUrl, 0.85)
        console.log(
          "[AI Editor] Applied user crop to reference image for AI mode:",
          elementCrop.width,
          "x",
          elementCrop.height
        )
      } catch (cropError) {
        console.warn("[AI Editor] Failed to crop reference image, using original:", cropError)
        const referenceBlob = await dataUrlToBlob(images.elementImage)
        const compressedReference = await resizeImageBlob(referenceBlob, 768, 0.85)
        processedReference = await blobToDataUrl(compressedReference)
      }
    } else {
      const referenceBlob = await dataUrlToBlob(images.elementImage)
      const compressedReference = await resizeImageBlob(referenceBlob, 768, 0.85)
      processedReference = await blobToDataUrl(compressedReference)
    }

    updateProgress("Sending request to AI model...", 48, { driftTo: 62 })

    // 构建提示词
    let finalPrompt: string
    if (params.prompt && params.prompt.trim()) {
      finalPrompt = params.prompt.trim()
      console.log("[AI Editor] Using user-provided prompt:", finalPrompt)
    } else if (currentAnalysis) {
      finalPrompt = buildPromptFromAnalysis(currentAnalysis)
      console.log("[AI Editor] Using AI analysis for prompt")
      console.log("[AI Editor] Analysis:", currentAnalysis)
      console.log("[AI Editor] Built prompt:", finalPrompt)
    } else {
      // 如果分析失败，使用通用提示词作为后备
      // 当用户有裁剪区域时，明确告知 AI 只用裁剪出来的那个元素
      if (elementCrop && elementCrop.width > 0 && elementCrop.height > 0) {
        finalPrompt = `COPY EXACTLY the ${elementCrop.width}×${elementCrop.height} cropped region from the reference image — do not use any area outside this selection. ` +
          `Place it precisely into the masked region. DO NOT invent new objects. ` +
          `DO NOT create decorations. Reproduce only what you see inside the cropped reference region.`
        console.warn("[AI Editor] No analysis — using crop-aware fallback prompt, elementCrop:", elementCrop)
      } else {
        finalPrompt = "COPY the EXACT elements from the reference image into the masked region. Do NOT create new objects. Do NOT invent decorations. Only reproduce what you SEE in the reference."
        console.warn("[AI Editor] No analysis available, using fallback prompt")
      }
    }

    console.log("[AI Editor] Final prompt being sent:", finalPrompt)
    console.log("[AI Editor] Has elementCrop:", !!elementCrop, elementCrop)

    // ── Pixel-perfect composite: place reference pixels directly into the masked
    //    region BEFORE sending to AI. This ensures the AI uses the actual
    //    reference content (not just as a "style hint") and only needs to
    //    blend edges rather than regenerate content.
    updateProgress("Compositing reference into target region...", 50, { driftTo: 58 })
    let compositedBase = processedBaseImage

    if (hasExplicitCrop && mask) {
      try {
        const [baseImgEl, maskImgEl] = await Promise.all([
          loadImage(processedBaseImage),
          loadImage(processedMaskImage),
        ])
        const resizedBaseW = baseImgEl.width
        const resizedBaseH = baseImgEl.height

        // Scale mask coords from mask canvas space to the resized base space.
        const scaledMask = {
          x: Math.round(mask.coordinates.x * (resizedBaseW / maskImgEl.width)),
          y: Math.round(mask.coordinates.y * (resizedBaseH / maskImgEl.height)),
          width: Math.round(mask.coordinates.width * (resizedBaseW / maskImgEl.width)),
          height: Math.round(mask.coordinates.height * (resizedBaseH / maskImgEl.height)),
        }

        console.log("[AI Editor] Composite: mask at", scaledMask)

        // The explicit crop is already applied before resizing, so we only need
        // to scale the cropped reference up to the working base resolution here.
        const croppedRefUpscaled = await resizeImage(processedReference, resizedBaseW, resizedBaseH)

        const composited = await compositeElementPixelPerfect(
          processedBaseImage,
          croppedRefUpscaled.dataUrl,
          scaledMask,
          resizedBaseW,
          resizedBaseH,
          resizedBaseW,
          resizedBaseH
        )
        compositedBase = composited
        console.log("[AI Editor] Pixel-perfect composite done")
      } catch (compositeError) {
        console.warn("[AI Editor] Pixel-perfect composite failed:", compositeError)
      }
    }

    // ── Decision: should we call inpaint API or return pixel composite directly?
    //
    // AI Generate mode is supposed to let AI "reinterpret" the reference.
    // However, the Gemini inpaint API does not reliably preserve our pixel-perfect
    // composite — it tends to regenerate the masked region from the reference rather
    // than blend our placed pixels with the surroundings.
    //
    // The intended behaviour (per user feedback) is:
    //   AI Generate = pixel composite + AI edge blend
    // But inpaint is not the right API for the blend step — use the fusion API instead.
    //
    // For now, when the user has explicitly cropped an element region,
    // return the pixel-perfect composite directly. The Direct Patch → fusion
    // path handles edge blending. AI Generate = "place the element exactly".
    // (A future iteration can wire up fusion after pixel-composite for AI Generate.)
    //
    if (hasExplicitCrop) {
      console.log("[AI Editor] AI Generate: returning pixel-composited result directly (skip inpaint)")
      return compositedBase
    }

    // No explicit crop — fall back to inpaint API (original behaviour)
    updateProgress("Sending request to AI model...", 60, { driftTo: 72 })

    const response = await fetch("/api/inpaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_image: compositedBase,
        mask_image: processedMaskImage,
        reference_image: processedReference,
        prompt: finalPrompt,
        options: {
          strength: params.strength,
          steps: 30,
          guidance_scale: params.guidance,
        },
      }),
    })

    if (!response.ok) {
      console.warn("[AI Editor] Inpaint API failed:", await response.text())
      return compositedBase
    }

    updateProgress("AI model processing response...", 75, { driftTo: 80 })
    const data = await safeParseJSON(response) as { result_image?: string }

    if (!data.result_image) {
      throw new Error("Inpainting API response missing result image")
    }

    return data.result_image
  }, [images, mask, params, imageAnalysis, analyzeImage, elementCrop, updateProgress])

  // 处理主流程
  const handleProcess = useCallback(async () => {
    if (!images.baseImage || !images.elementImage || !mask) return

    setIsProcessing(true)
    setError(null)
    updateProgress("Preparing images...", 5)

    try {
      let finalImage: string

      if (params.editMode === "composite") {
        finalImage = await processCompositeMode()
      } else {
        try {
          finalImage = await processAIMode()
        } catch (aiError) {
          console.warn("[AI Editor] Inpaint failed, falling back to Direct Patch", aiError)
          updateProgress("AI inpaint failed, using direct composite fallback...", 65)
          finalImage = await processCompositeMode()
          console.log("[AI Editor] Fallback composite complete")
        }
      }

      // 融合结果得到图像后继续进度 (80%)
      updateProgress("Stabilizing blend...", 80)

      // 调整输出尺寸 (85%)
      if (params.outputDimensions.aspectRatio !== "original") {
        updateProgress("Adjusting output dimensions...", 85)
        try {
          const resized = await resizeToAspectRatio(
            finalImage,
            params.outputDimensions.aspectRatio,
            params.outputDimensions.scaleMode,
            params.outputDimensions.customWidth,
            params.outputDimensions.customHeight
          )
          finalImage = resized.dataUrl
          console.log("[AI Editor] Resized to", resized.width, "x", resized.height)
        } catch (resizeError) {
          console.error("Failed to resize result:", resizeError)
        }
      }

      updateProgress("Complete!", 90)
      setResultImage(finalImage)
      setStep("result")
      console.log("[AI Editor] Processing complete")
    } catch (error) {
      console.error("Processing failed:", error)
      setError(error instanceof Error ? error.message : "Failed to process image")
    } finally {
      stopProgressDrift()
      setIsProcessing(false)
      setProcessingStatus("")
      setProcessingProgress(0)
    }
  }, [images, mask, params, processCompositeMode, processAIMode, updateProgress, stopProgressDrift])

  // 重置状态
  const handleReset = useCallback(() => {
    setStep("upload")
    setImages(INITIAL_IMAGES)
    setMask(null)
    setResultImage(null)
    setParams(INITIAL_PARAMS)
    setIsProcessing(false)
    setError(null)
    setImageAnalysis(null)
    setIsAnalyzing(false)
    setProcessingStatus("")
    setProcessingProgress(0)
    setElementCrop(null)
    stopProgressDrift()
  }, [stopProgressDrift])

  return {
    step,
    images,
    mask,
    params,
    resultImage,
    isProcessing,
    processingStatus,
    processingProgress,
    error,
    imageAnalysis,
    isAnalyzing,
    elementCrop,
    setStep,
    setParams,
    setMask: handleMaskCreated,
    setElementCrop,
    handleImagesUploaded,
    handleProcess,
    handleReset,
  }
}
