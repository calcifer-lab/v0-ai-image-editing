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
import type { ElementCropperRef } from "@/components/element-cropper"
import type { CanvasEditorRef } from "@/components/canvas-editor"
import {
  resizeToAspectRatio,
  compositeImages,
  loadImage,
  resizeImage,
  compressImage,
} from "@/lib/image-utils"
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
  getElementCropperRef: () => ElementCropperRef | null
  setCanvasEditorRef: (ref: CanvasEditorRef | null) => void
  handleImagesUploaded: (elementImg: string, baseImg: string) => Promise<void>
  handleProcess: () => Promise<void>
  handleReset: () => void
}

// ============ 辅助函数 ============
async function cropImageToDataUrl(imageUrl: string, crop: CropRegion, maskCanvas?: HTMLCanvasElement): Promise<string> {
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

  // If a mask is provided, apply it to preserve the actual drawn shape (circle, freeform, etc.)
  if (maskCanvas) {
    const maskCtx = maskCanvas.getContext("2d")
    if (maskCtx) {
      const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
      const maskScaleX = safeWidth / maskCanvas.width
      const maskScaleY = safeHeight / maskCanvas.height

      // Create output canvas with extracted crop
      const outputCanvas = document.createElement("canvas")
      outputCanvas.width = safeWidth
      outputCanvas.height = safeHeight
      const outputCtx = outputCanvas.getContext("2d")
      if (outputCtx) {
        outputCtx.drawImage(canvas, 0, 0)

        // Apply mask: for each pixel in the mask, if black (not selected), make transparent
        for (let y = 0; y < safeHeight; y++) {
          for (let x = 0; x < safeWidth; x++) {
            const maskX = Math.floor(x / maskScaleX)
            const maskY = Math.floor(y / maskScaleY)
            const maskI = (maskY * maskCanvas.width + maskX) * 4
            // Black pixels in mask = not selected = transparent output
            if (maskImageData.data[maskI] === 0) {
              outputCtx.clearRect(x, y, 1, 1)
            }
          }
        }

        return outputCanvas.toDataURL("image/png")
      }
    }
  }

  return canvas.toDataURL("image/png")
}






// Compress large data URLs before network upload to stay under server limits
async function compressDataUrlForUpload(
  imageDataUrl: string,
  options?: { preserveTransparency?: boolean }
): Promise<string> {
  try {
    const { dataUrl } = await resizeImage(imageDataUrl, 1536, 1536)
    if (options?.preserveTransparency) {
      return dataUrl
    }

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
  const [warning, setWarning] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [elementCrop, setElementCrop] = useState<CropRegion | null>(null)
  const elementCropperRef = useRef<ElementCropperRef | null>(null)
  const canvasEditorRef = useRef<CanvasEditorRef | null>(null)

  // Background removal result — populated after user previews cutout in Element Cropper
  // Stores the post-RMBG cutout so user can review and refine before compositing
  const [processedElement, setProcessedElement] = useState<{
    image: string   // Cutout PNG (transparent background)
    mask: string    // Alpha mask PNG (white = subject, black = background)
  } | null>(null)
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
          imageToAnalyze = await cropImageToDataUrl(elementImg, crop, elementCropperRef.current?.maskCanvas ?? undefined)
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

  const runFusionPass = useCallback(async (
    compositeImage: string,
    referenceImage?: string,
    progress?: { status: string; value: number; driftTo?: number }
  ): Promise<string> => {
    if (!images.baseImage || !mask) {
      throw new Error("Missing base image or mask for fusion")
    }

    if (progress) {
      updateProgress(progress.status, progress.value, progress.driftTo ? { driftTo: progress.driftTo } : undefined)
    }

    try {
      const [compressedComposite, compressedBase, compressedReference] = await Promise.all([
        compressDataUrlForUpload(compositeImage),
        compressDataUrlForUpload(images.baseImage),
        referenceImage
          ? compressDataUrlForUpload(referenceImage, { preserveTransparency: true })
          : Promise.resolve(undefined),
      ])

      const fusionController = new AbortController()
      const fusionTimeout = setTimeout(() => fusionController.abort(), 120_000)
      let fusionResponse: Response
      try {
        fusionResponse = await fetch("/api/fusion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            composite_image: compressedComposite,
            original_base: compressedBase,
            reference_image: compressedReference,
            mask_region: mask.coordinates,
          }),
          signal: fusionController.signal,
        })
      } finally {
        clearTimeout(fusionTimeout)
      }

      if (!fusionResponse.ok) {
        const errorText = await fusionResponse.text().catch(() => "")
        console.warn("[AI Editor] AI fusion failed, using unfused composite:", errorText)
        setError("AI fusion failed — showing the unblended composite instead. Please try again.")
        return compositeImage
      }

      const fusionData = await safeParseJSON(fusionResponse) as {
        fused_image?: string
        meta?: { model?: string }
      }

      if (fusionData.fused_image) {
        console.log("[AI Editor] AI fusion complete:", fusionData.meta?.model)
        return fusionData.fused_image
      }
    } catch (fusionError) {
      console.warn("[AI Editor] AI fusion error:", fusionError)
      setError("AI fusion failed — showing the unblended composite instead. Please try again.")
    }

    return compositeImage
  }, [images.baseImage, mask, updateProgress, setError])

  // 处理直接合成模式（带 AI 融合）
  const processCompositeMode = useCallback(async (): Promise<string> => {
    if (!images.baseImage || !images.elementImage || !mask) {
      throw new Error("Missing required images or mask")
    }

    console.log("[AI Editor] Using Direct Patch mode with AI fusion")

    // 裁剪参考图片 (10%)
    updateProgress("Preparing reference image...", 10)
    const hasExplicitCrop = !!(elementCrop && elementCrop.width > 0 && elementCrop.height > 0)
    // CanvasEditor's brush mask (the circular/freeform strokes drawn by user)
    const canvasEditorMaskCanvas = canvasEditorRef.current?.maskCanvas ?? undefined
    // Use elementCrop if explicitly set via ElementCropper; do NOT fall back to mask coordinates as
    // imageWidth/imageHeight must reflect the element image dimensions, not the mask canvas size.
    const cropRegion = elementCrop ?? null

    let processedReference = images.elementImage
    if (hasExplicitCrop && elementCrop) {
      try {
        processedReference = await cropImageToDataUrl(images.elementImage, elementCrop, undefined)
        console.log("[AI Editor] Applied user crop to reference image")
      } catch (cropError) {
        console.warn("[AI Editor] Failed to crop reference image, using original", cropError)
      }
    }

    // 移除背景 (25%)
    updateProgress("Removing background...", 25)
    try {
      const compressedForBgRemoval = await compressDataUrlForUpload(processedReference, { preserveTransparency: false })
      const bgController = new AbortController()
      const bgTimeout = setTimeout(() => bgController.abort(), 120_000)
      let bgResponse: Response
      try {
        bgResponse = await fetch("/api/remove-background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedForBgRemoval }),
          signal: bgController.signal,
        })
      } finally {
        clearTimeout(bgTimeout)
      }

      if (bgResponse.ok) {
        const bgData = await bgResponse.json()
        if (bgData.result_image) {
          processedReference = bgData.result_image
          console.log("[AI Editor] Background removed successfully")
        } else {
          console.warn("[AI Editor] Background removal returned no result, using original image (element may have white background)")
          setError("Background removal returned no result — element may appear with its original background. Try again or use a pre-cutout image.")
        }
      } else {
        const errText = await bgResponse.text().catch(() => "")
        console.warn("[AI Editor] Background removal failed:", errText, "— using original image")
        setError("Background removal failed — element may appear with its original background. Try again or use a pre-cutout image.")
      }
    } catch (bgError) {
      console.warn("[AI Editor] Background removal error:", bgError)
      setError("Background removal failed — element may appear with its original background.")
    }

    // 合成图片 (40%)
    // toneMatchStrength=0: skip local color correction — /api/fusion (Gemini) handles all
    // lighting/color harmonization. Pre-adjusting here causes double-correction artifacts.
    updateProgress("Patching element into image...", 40)
    const compositeResult = await compositeImages(
      images.baseImage,
      processedReference,
      mask.dataUrl,
      mask.coordinates,
      canvasEditorMaskCanvas,
      { toneMatchStrength: 0 }
    )

    console.log("[AI Editor] Composite complete, starting AI fusion...")

    const fusedResult = await runFusionPass(compositeResult, processedReference, {
      status: "AI fusion: Harmonizing lighting and style...",
      value: 60,
      driftTo: 78,
    })

    if (fusedResult === compositeResult) {
      console.log("[AI Editor] Direct Patch complete (no fusion)")
    }

    return fusedResult
  }, [images, mask, elementCrop, runFusionPass, updateProgress])

  // 处理 AI 生成模式 (AI Compose)
  // Strategy: ghost-overlay inpaint.
  //   1. Remove background from reference.
  //   2. Composite reference at 50 % opacity into the base ("ghost overlay") — this gives
  //      Gemini a strong visual anchor for WHERE and WHAT to place, while still leaving the
  //      AI free to generate natural integration.
  //   3. Send ghost base + reference + mask to /api/inpaint so the AI generates a fully
  //      integrated, naturally lit version rather than reusing the pixel-blend result.
  // Falls back to processCompositeMode if inpaint fails.
  const processAIMode = useCallback(async (): Promise<string> => {
    if (!images.baseImage || !images.elementImage || !mask) {
      throw new Error("Missing required images or mask")
    }

    // Crop reference if user defined a crop region (same as Direct Patch)
    updateProgress("Preparing reference image...", 10)
    const hasExplicitCrop = !!(elementCrop && elementCrop.width > 0 && elementCrop.height > 0)
    let processedReference = images.elementImage
    if (hasExplicitCrop && elementCrop) {
      try {
        processedReference = await cropImageToDataUrl(images.elementImage, elementCrop, undefined)
      } catch (cropError) {
        console.warn("[AI Editor] Failed to crop reference, using original:", cropError)
      }
    }

    // Remove background so only the subject is composited into the ghost
    updateProgress("Removing background...", 20)
    try {
      const compressedForBg = await compressDataUrlForUpload(processedReference, { preserveTransparency: false })
      const bgController = new AbortController()
      const bgTimeout = setTimeout(() => bgController.abort(), 120_000)
      let bgResponse: Response
      try {
        bgResponse = await fetch("/api/remove-background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedForBg }),
          signal: bgController.signal,
        })
      } finally {
        clearTimeout(bgTimeout)
      }
      if (bgResponse.ok) {
        const bgData = await bgResponse.json()
        if (bgData.result_image) processedReference = bgData.result_image
        else console.warn("[AI Editor] BG removal: no result_image in response")
      } else {
        console.warn("[AI Editor] BG removal failed:", bgResponse.status, "— continuing with original")
      }
    } catch (bgError) {
      console.warn("[AI Editor] BG removal error, continuing:", bgError)
    }

    // Ghost overlay: blend reference at 50% opacity so Gemini can see WHERE and WHAT to place
    updateProgress("Creating reference overlay for AI...", 35)
    const ghostBase = await compositeImages(
      images.baseImage,
      processedReference,
      mask.dataUrl,
      mask.coordinates,
      undefined,
      { toneMatchStrength: 0, blendStrength: 0.5 }
    )

    // Compress all inputs for upload
    updateProgress("Compressing images for AI generation...", 45)
    const [compressedGhostBase, compressedMask, compressedRef] = await Promise.all([
      compressDataUrlForUpload(ghostBase),
      compressDataUrlForUpload(mask.dataUrl),
      compressDataUrlForUpload(processedReference, { preserveTransparency: true }),
    ])

    const aiPrompt = params.prompt?.trim() ||
      "The masked region contains a translucent ghost of the reference element (composited at 50% opacity). " +
      "Generate a FULLY OPAQUE, naturally integrated version of this element. " +
      "The element MUST match the reference image exactly — preserve its colors, shape, and details. " +
      "Blend it seamlessly with the surrounding scene: match the lighting direction, color temperature, and art style. " +
      "The result must look as if the element was always part of this scene."

    // Call inpaint — ghost base gives Gemini a clear visual context for what to generate
    updateProgress("AI Compose: generating from reference...", 52, { driftTo: 78 })
    const inpaintController = new AbortController()
    const inpaintTimeout = setTimeout(() => inpaintController.abort(), 240_000)
    let response: Response
    try {
      response = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_image: compressedGhostBase,
          mask_image: compressedMask,
          reference_image: compressedRef,
          prompt: aiPrompt,
          options: { strength: params.strength, steps: 30, guidance_scale: params.guidance },
        }),
        signal: inpaintController.signal,
      })
    } finally {
      clearTimeout(inpaintTimeout)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(errorText || `Inpaint API error: ${response.status}`)
    }

    updateProgress("AI model processing response...", 80, { driftTo: 85 })
    const data = await safeParseJSON(response) as { result_image?: string }
    if (!data.result_image) throw new Error("Inpainting API response missing result image")

    return data.result_image
  }, [images, mask, params, elementCrop, updateProgress])

  // 处理主流程
  const handleProcess = useCallback(async () => {
    if (!images.baseImage || !images.elementImage || !mask) return

    setIsProcessing(true)
    setError(null)
    setWarning(null)
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
          setWarning("AI 不可用，显示的是直接拼图")
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
    warning,
    imageAnalysis,
    isAnalyzing,
    elementCrop,
    setStep,
    setParams,
    setMask: handleMaskCreated,
    setElementCrop,
    getElementCropperRef: () => elementCropperRef.current,
    setCanvasEditorRef: (ref: CanvasEditorRef | null) => { canvasEditorRef.current = ref },
    handleImagesUploaded,
    handleProcess,
    handleReset,
  }
}
