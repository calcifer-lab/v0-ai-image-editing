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
import { resizeToAspectRatio, compositeImages, loadImage } from "@/lib/image-utils"
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
  setMask: (mask: MaskData) => void
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

  // Build an alpha-only mask: white => remove, black => keep
  const maskCanvas = document.createElement("canvas")
  maskCanvas.width = baseImg.width
  maskCanvas.height = baseImg.height
  const maskCtx = maskCanvas.getContext("2d")
  if (!maskCtx) throw new Error("Failed to get mask canvas context")
  maskCtx.drawImage(maskImg, 0, 0, baseImg.width, baseImg.height)
  const maskData = maskCtx.getImageData(0, 0, baseImg.width, baseImg.height)
  const data = maskData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const isWhite = r > 200 && g > 200 && b > 200
    data[i] = 0
    data[i + 1] = 0
    data[i + 2] = 0
    data[i + 3] = isWhite ? 255 : 0
  }
  maskCtx.putImageData(maskData, 0, 0)

  // Draw base, then punch a hole where mask is white
  ctx.drawImage(baseImg, 0, 0, baseImg.width, baseImg.height)
  ctx.globalCompositeOperation = "destination-out"
  ctx.drawImage(maskCanvas, 0, 0, baseImg.width, baseImg.height)
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
  const handleMaskCreated = useCallback((maskData: MaskData) => {
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
    let processedReference = images.elementImage
    if (elementCrop) {
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
      const fusionResponse = await fetch("/api/fusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composite_image: compositeResult,
          original_base: images.baseImage,
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

    // Downscale inputs to avoid oversized payloads before calling inpaint
    const [baseBlob, maskBlob, referenceBlob] = await Promise.all([
      dataUrlToBlob(images.baseImage),
      dataUrlToBlob(mask.dataUrl),
      dataUrlToBlob(images.elementImage),
    ])

    const [compressedBase, compressedMask, compressedReference] = await Promise.all([
      resizeImageBlob(baseBlob, 1536, 0.85),
      // Keep mask aligned to the same dimensions as the base to avoid misalignment
      resizeImageBlob(maskBlob, 1536, 0.95),
      resizeImageBlob(referenceBlob, 768, 0.85),
    ])

    let processedBaseImage = await blobToDataUrl(compressedBase)
    let processedReferenceImage = await blobToDataUrl(compressedReference)
    const processedMaskImage = await blobToDataUrl(compressedMask)

    // Remove masked region from the base so the model is forced to replace it
    processedBaseImage = await removeMaskedRegionFromBase(processedBaseImage, processedMaskImage)

    // 使用局部变量跟踪分析结果，避免闭包捕获的状态值过时问题
    let currentAnalysis = imageAnalysis

    // Trigger image analysis if not already done - 传入 elementCrop 以聚焦分析用户选择的区域
    if (!currentAnalysis && !params.prompt.trim()) {
      setProcessingStatus("Analyzing selected element region...")
      const freshAnalysis = await analyzeImage(images.elementImage, elementCrop)
      // 立即使用新鲜的分析结果，避免依赖可能为 null 的旧状态
      currentAnalysis = freshAnalysis
    }

    // 裁剪参考图片（如果用户有选择裁剪区域）
    setProcessingStatus("Preparing reference image...")
    let processedReference = processedReferenceImage
    if (elementCrop && elementCrop.width > 0 && elementCrop.height > 0) {
      try {
        processedReference = await cropImageToDataUrl(processedReferenceImage, elementCrop)
        console.log("[AI Editor] Applied user crop to reference image for AI mode:", elementCrop.width, "x", elementCrop.height)
      } catch (cropError) {
        console.warn("[AI Editor] Failed to crop reference image, using original:", cropError)
      }
    }

    setProcessingStatus("Sending request to AI model...")

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
      finalPrompt = "COPY the EXACT elements from the reference image into the masked region. Do NOT create new objects. Do NOT invent decorations. Only reproduce what you SEE in the reference."
      console.warn("[AI Editor] No analysis available, using fallback prompt")
    }

    console.log("[AI Editor] Final prompt being sent:", finalPrompt)
    console.log("[AI Editor] Has elementCrop:", !!elementCrop, elementCrop)

    const response = await fetch("/api/inpaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_image: processedBaseImage,
        mask_image: processedMaskImage,
        reference_image: processedReference,  // 使用裁剪后的参考图片
        prompt: finalPrompt,
        options: {
          strength: params.strength,
          steps: 30,
          guidance_scale: params.guidance,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(await response.text() || `API error: ${response.status}`)
    }

    setProcessingStatus("Processing complete, loading result...")
    const data = await safeParseJSON(response) as { result_image?: string }

    if (!data.result_image) {
      throw new Error("Inpainting API response missing result image")
    }

    return data.result_image
  }, [images, mask, params, imageAnalysis, analyzeImage, elementCrop])

  // 处理主流程
  const handleProcess = useCallback(async () => {
    if (!images.baseImage || !images.elementImage || !mask) return

    setIsProcessing(true)
    setError(null)
    setProcessingStatus("Preparing images...")

    try {
      let finalImage: string

      if (params.editMode === "composite") {
        finalImage = await processCompositeMode()
      } else {
        try {
          finalImage = await processAIMode()
        } catch (aiError) {
          console.warn("[AI Editor] Inpaint failed, falling back to Direct Patch", aiError)
          setProcessingStatus("AI inpaint failed, using direct composite fallback...")
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
