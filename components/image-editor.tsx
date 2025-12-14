"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import ImageUploadSection from "@/components/image-upload-section"
import CanvasEditor from "@/components/canvas-editor"
import ControlPanel from "@/components/control-panel"
import ResultsView from "@/components/results-view"
import ElementCropper from "@/components/element-cropper"
import { Upload, Wand2, ImageIcon } from "lucide-react"
import { useImageEditor } from "@/hooks"

export type { EditorStep, EditMode, ImageData, MaskData, AspectRatio, ScaleMode, OutputDimensions, EditParams, CropRegion } from "@/types"

export default function ImageEditor() {
  const {
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
    setMask,
    setElementCrop,
    handleImagesUploaded,
    handleProcess,
    handleReset,
  } = useImageEditor()

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <EditorHeader step={step} onReset={handleReset} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {step === "upload" && (
          <ImageUploadSection onImagesUploaded={handleImagesUploaded} />
        )}

        {step === "edit" && (
          <div className="flex h-full gap-6 overflow-hidden p-6">
            {/* Left: Two editors side by side */}
            <div className="min-w-0 flex-1 overflow-y-auto">
              <div className="grid gap-6 lg:grid-cols-2">
                <CanvasEditor
                  elementImage={images.elementImage!}
                  baseImage={images.baseImage!}
                  onMaskCreated={setMask}
                />
                <ElementCropper
                  image={images.elementImage!}
                  crop={elementCrop}
                  onCropChange={setElementCrop}
                />
              </div>
            </div>
            {/* Right: Control Panel */}
            <div className="w-72 shrink-0 overflow-y-auto">
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
      </main>
    </div>
  )
}


interface EditorHeaderProps {
  step: "upload" | "edit" | "result"
  onReset: () => void
}

function EditorHeader({ step, onReset }: EditorHeaderProps) {
  return (
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
        <nav className="flex items-center gap-2" aria-label="Progress">
          <StepIndicator
            label="Upload"
            icon={Upload}
            active={step === "upload"}
            completed={step === "edit" || step === "result"}
          />
          <div className="h-px w-8 bg-border" aria-hidden="true" />
          <StepIndicator
            label="Edit"
            icon={Wand2}
            active={step === "edit"}
            completed={step === "result"}
          />
          <div className="h-px w-8 bg-border" aria-hidden="true" />
          <StepIndicator
            label="Result"
            icon={ImageIcon}
            active={step === "result"}
            completed={false}
          />
        </nav>

        <Button variant="outline" size="sm" onClick={onReset}>
          Start New
        </Button>
      </div>
    </header>
  )
}

interface StepIndicatorProps {
  label: string
  icon: React.ElementType
  active: boolean
  completed: boolean
}

function StepIndicator({ label, icon: Icon, active, completed }: StepIndicatorProps) {
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
        aria-current={active ? "step" : undefined}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  )
}
