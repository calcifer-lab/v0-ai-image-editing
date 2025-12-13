"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ImageUploadSection from "@/components/image-upload-section"
import CanvasEditor from "@/components/canvas-editor"
import ControlPanel from "@/components/control-panel"
import ResultsView from "@/components/results-view"
import ElementCropper from "@/components/element-cropper"
import { Upload, Wand2, ImageIcon } from "lucide-react"
import { resizeToAspectRatio, compositeImages, loadImage } from "@/lib/image-utils"

export type EditorStep = "upload" | "edit" | "result"
export type EditMode = "ai" | "composite"

export interface ImageData {
  elementImage: string | null
  baseImage: string | null
}

export interface MaskData {
  dataUrl: string
  coordinates: { x: number; y: number; width: number; height: number }
}

export type AspectRatio = "original" | "1:1" | "4:3" | "16:9" | "3:2" | "9:16" | "custom"
export type ScaleMode = "fit" | "fill" | "stretch"

export interface OutputDimensions {
  aspectRatio: AspectRatio
  scaleMode: ScaleMode
  customWidth?: number
  customHeight?: number
}

export interface EditParams {
  prompt: string
  strength: number
  guidance: number
  preserveStructure: boolean
  outputDimensions: OutputDimensions
  editMode: EditMode
}

export interface CropRegion {
  x: number
  y: number
  width: number
  height: number
  imageWidth: number
  imageHeight: number
}

export default function ImageEditor() {
  const [step, setStep] = useState<EditorStep>("upload")
  const [images, setImages] = useState<ImageData>({
    elementImage: null,
    baseImage: null,
  })
  const [mask, setMask] = useState<MaskData | null>(null)
  const [params, setParams] = useState<EditParams>({
    prompt: "",
    strength: 0.8,
    guidance: 7.5,
    preserveStructure: true,
    outputDimensions: {
      aspectRatio: "original",
      scaleMode: "fit",
    },
    editMode: "ai", // Default to AI mode
  })
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [elementCrop, setElementCrop] = useState<CropRegion | null>(null)

  const handleImagesUploaded = async (elementImg: string, baseImg: string) => {
    console.log("[AI Editor] Images uploaded, analyzing element image...")
    setImages({ elementImage: elementImg, baseImage: baseImg })
    setElementCrop(null)
    setError(null)

    // Automatically analyze the element image using GPT-4o-mini
    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: elementImg,
          // Using the default prompt from analyze-image API which is now optimized for object extraction
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      setImageAnalysis(data.analysis)
      console.log("[AI Editor] Image analysis complete:", data.analysis)
    } catch (err) {
      console.error("Failed to analyze image:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze image")
    } finally {
      setIsAnalyzing(false)
    }

    setStep("edit")
  }

  const handleMaskCreated = (maskData: MaskData) => {
    setMask(maskData)
  }

  const handleProcess = async () => {
    if (!images.baseImage || !images.elementImage || !mask) return

    setIsProcessing(true)
    setError(null)
    setProcessingStatus("Preparing images...")

    try {
      let finalImage: string

      if (params.editMode === "composite") {
        // Direct composite mode - paste reference image directly
        console.log("[AI Editor] Using direct composite mode")

        // Optional: crop the reference image before background removal
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

        // Step 1: Remove background from reference image (after crop if applied)
        setProcessingStatus("Removing background from reference image...")
        
        try {
          const bgResponse = await fetch("/api/remove-background", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: images.elementImage }),
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
        
        // Step 2: Composite the processed reference onto base image
        setProcessingStatus("Compositing images...")
        
        finalImage = await compositeImages(
          images.baseImage,
          processedReference,
          mask.dataUrl,
          mask.coordinates
        )
        
        console.log("[AI Editor] Direct composite complete")
      } else {
        // AI generation mode
        setProcessingStatus("Sending request to AI model...")

        // Build prompt using AI analysis if available
        // Priority: user's custom prompt > AI analysis > fallback
        let finalPrompt: string
        
        if (params.prompt && params.prompt.trim()) {
          // User provided custom prompt - use it directly
          finalPrompt = params.prompt.trim()
        } else if (imageAnalysis) {
          // Extract key object description from AI analysis
          let objectDescription = ""
          let layeredStructure = ""
          
          // Try to extract from "Main Subject/Object" section
          const mainSubjectMatch = imageAnalysis.match(/Main Subject[^:]*:?\s*([^\n]+)/i)
          if (mainSubjectMatch) {
            objectDescription = mainSubjectMatch[1].replace(/\*+/g, "").trim()
          }
          
          // Try to extract layered structure
          const layeredMatch = imageAnalysis.match(/Layered Structure[^:]*:?\s*([\s\S]*?)(?=\*\*|$)/i)
          if (layeredMatch) {
            layeredStructure = layeredMatch[1].replace(/\*+/g, "").trim().split('\n').slice(0, 3).join('; ')
          }
          
          // Build comprehensive prompt
          if (objectDescription) {
            finalPrompt = `EXACTLY reproduce: ${objectDescription}.`
            if (layeredStructure) {
              finalPrompt += ` Structure: ${layeredStructure}.`
            }
            finalPrompt += ` Copy ALL elements faithfully, preserving every layer and detail. Match the target image's art style.`
          } else {
            // Use a condensed version of the analysis
            const firstLine = imageAnalysis.split('\n')[0].replace(/\*+/g, "").trim()
            finalPrompt = `EXACTLY reproduce: ${firstLine}. Copy all elements faithfully.`
          }
          
          console.log("[AI Editor] Using AI analysis for prompt:", finalPrompt)
        } else {
          // Fallback
          finalPrompt = "Replace the masked area with content from the reference image"
        }

        const response = await fetch("/api/inpaint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base_image: images.baseImage,
            mask_image: mask.dataUrl,
            reference_image: images.elementImage,
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
        finalImage = data.result_image
      }

      // Apply output dimensions if not using original
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
          // Continue with original result if resize fails
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
  }

  const handleReset = () => {
    setStep("upload")
    setImages({ elementImage: null, baseImage: null })
    setMask(null)
    setResultImage(null)
      setParams({
        prompt: "",
        strength: 0.8,
        guidance: 7.5,
        preserveStructure: true,
        outputDimensions: {
          aspectRatio: "original",
          scaleMode: "fit",
        },
        editMode: "ai",
      })
      setIsProcessing(false)
      setError(null)
      setImageAnalysis(null)
      setIsAnalyzing(false)
      setProcessingStatus("")
      setElementCrop(null)
    }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ImageIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Image Editor</h1>
              <p className="text-xs text-muted-foreground">Structural editing powered by AI</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <StepIndicator
              label="Upload"
              icon={Upload}
              active={step === "upload"}
              completed={step === "edit" || step === "result"}
            />
            <div className="h-px w-8 bg-border" />
            <StepIndicator label="Edit" icon={Wand2} active={step === "edit"} completed={step === "result"} />
            <div className="h-px w-8 bg-border" />
            <StepIndicator label="Result" icon={ImageIcon} active={step === "result"} completed={false} />
          </div>

          <Button variant="outline" size="sm" onClick={handleReset}>
            Start New
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {step === "upload" && <ImageUploadSection onImagesUploaded={handleImagesUploaded} />}

        {step === "edit" && (
          <div className="flex flex-1 gap-6 p-6">
            <div className="flex flex-1 flex-col gap-4">
              <CanvasEditor
                elementImage={images.elementImage!}
                baseImage={images.baseImage!}
                onMaskCreated={handleMaskCreated}
              />
              <ElementCropper
                image={images.elementImage!}
                crop={elementCrop}
                onCropChange={setElementCrop}
              />
            </div>
            <div className="w-80">
              <ControlPanel
                params={params}
                onParamsChange={setParams}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                canProcess={!!mask}
                processingStatus={processingStatus}
                error={error}
                imageAnalysis={imageAnalysis}
                isAnalyzing={isAnalyzing}
              />
            </div>
          </div>
        )}

        {step === "result" && (
          <ResultsView
            originalImage={images.baseImage!}
            resultImage={resultImage!}
            onEdit={() => setStep("edit")}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

function StepIndicator({
  label,
  icon: Icon,
  active,
  completed,
}: {
  label: string
  icon: React.ElementType
  active: boolean
  completed: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : completed
              ? "border-primary bg-primary/10 text-primary"
              : "border-muted-foreground/30 text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  )
}

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
