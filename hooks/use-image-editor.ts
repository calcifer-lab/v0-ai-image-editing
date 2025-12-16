"use client"

import { useState, useCallback } from "react"
import type {
  EditorStep,
  ImageData,
  MaskData,
  EditParams,
  CropRegion,
  DEFAULT_EDIT_PARAMS,
} from "@/types"
import { resizeToAspectRatio, compositeImages, loadImage } from "@/lib/image-utils"

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
  const [error, setError] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [elementCrop, setElementCrop] = useState<CropRegion | null>(null)

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

  // 处理直接合成模式
  const processCompositeMode = useCallback(async (): Promise<string> => {
    if (!images.baseImage || !images.elementImage || !mask) {
      throw new Error("Missing required images or mask")
    }

    console.log("[AI Editor] Using direct composite mode")

    // 裁剪参考图片
    setProcessingStatus("Preparing reference image crop...")
    let processedReference = images.elementImage
    if (elementCrop) {
      try {
        processedReference = await cropImageToDataUrl(images.elementImage, elementCrop)
        console.log("[AI Editor] Applied user crop to reference image")
      } catch (cropError) {
        console.warn("[AI Editor] Failed to crop reference image, using original", cropError)
      }
    }

    // 移除背景
    setProcessingStatus("Removing background from reference image...")
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
    
    // 合成图片
    setProcessingStatus("Compositing images...")
    const result = await compositeImages(
      images.baseImage,
      processedReference,
      mask.dataUrl,
      mask.coordinates
    )
    
    console.log("[AI Editor] Direct composite complete")
    return result
  }, [images, mask, elementCrop])

  // 处理 AI 生成模式
  const processAIMode = useCallback(async (): Promise<string> => {
    if (!images.baseImage || !images.elementImage || !mask) {
      throw new Error("Missing required images or mask")
    }

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
    let processedReference = images.elementImage
    if (elementCrop && elementCrop.width > 0 && elementCrop.height > 0) {
      try {
        processedReference = await cropImageToDataUrl(images.elementImage, elementCrop)
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
        base_image: images.baseImage,
        mask_image: mask.dataUrl,
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
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    setProcessingStatus("Processing complete, loading result...")
    const data = await response.json()
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
        finalImage = await processAIMode()
      }

      // 调整输出尺寸
      if (params.outputDimensions.aspectRatio !== "original") {
        setProcessingStatus("Adjusting output dimensions...")
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

      setResultImage(finalImage)
      setStep("result")
      console.log("[AI Editor] Processing complete")
    } catch (error) {
      console.error("Processing failed:", error)
      setError(error instanceof Error ? error.message : "Failed to process image")
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
    }
  }, [images, mask, params, processCompositeMode, processAIMode])

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
  }, [])

  return {
    step,
    images,
    mask,
    params,
    resultImage,
    isProcessing,
    processingStatus,
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
