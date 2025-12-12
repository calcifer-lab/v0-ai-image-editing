"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ImageUploadSection from "@/components/image-upload-section"
import CanvasEditor from "@/components/canvas-editor"
import ControlPanel from "@/components/control-panel"
import ResultsView from "@/components/results-view"
import { Upload, Wand2, ImageIcon } from "lucide-react"

export type EditorStep = "upload" | "edit" | "result"

export interface ImageData {
  elementImage: string | null
  baseImage: string | null
}

export interface MaskData {
  dataUrl: string
  coordinates: { x: number; y: number; width: number; height: number }
}

export interface EditParams {
  prompt: string
  strength: number
  guidance: number
  preserveStructure: boolean
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
  })
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImagesUploaded = (elementImg: string, baseImg: string) => {
    console.log("[v0] handleImagesUploaded called")
    console.log("[v0] Setting images and moving to edit step")
    setImages({ elementImage: elementImg, baseImage: baseImg })
    setStep("edit")
    console.log("[v0] Step should now be: edit")
  }

  const handleMaskCreated = (maskData: MaskData) => {
    setMask(maskData)
  }

  const handleProcess = async () => {
    if (!images.baseImage || !images.elementImage || !mask) return

    setIsProcessing(true)

    // Simulate AI processing
    // In production, this would call your AI API endpoint
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock result - in production, this would be the AI-generated image
      setResultImage(images.baseImage)
      setStep("result")
    } catch (error) {
      console.error("Processing failed:", error)
    } finally {
      setIsProcessing(false)
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
    })
    setIsProcessing(false)
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
            <div className="flex-1">
              <CanvasEditor
                elementImage={images.elementImage!}
                baseImage={images.baseImage!}
                onMaskCreated={handleMaskCreated}
              />
            </div>
            <div className="w-80">
              <ControlPanel
                params={params}
                onParamsChange={setParams}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                canProcess={!!mask}
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
