"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, X, RefreshCw, Loader2 } from "lucide-react"
import { removeWatermark } from "@/lib/image-utils"

// ============ 类型定义 ============
interface ImageUploadSectionProps {
  onImagesUploaded: (elementImage: string, baseImage: string) => void
}

type ImageType = "element" | "base"

// ============ 主组件 ============
export default function ImageUploadSection({ onImagesUploaded }: ImageUploadSectionProps) {
  const [elementImage, setElementImage] = useState<string | null>(null)
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File, type: ImageType) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result as string
      
      // 自动移除 AI 水印
      setIsProcessing(true)
      try {
        const processedImage = await removeWatermark(result, 40)
        if (type === "element") {
          setElementImage(processedImage)
        } else {
          setBaseImage(processedImage)
        }
        console.log("[Upload] Watermark removed from", type, "image")
      } catch (err) {
        console.error("Failed to process image:", err)
        // 回退到原始图片
        if (type === "element") {
          setElementImage(result)
        } else {
          setBaseImage(result)
        }
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  // 处理拖放
  const handleDrop = useCallback(
    (e: React.DragEvent, type: ImageType) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file, type)
      }
    },
    [handleFileUpload]
  )

  // 处理文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: ImageType) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileUpload(file, type)
      }
    },
    [handleFileUpload]
  )

  // 处理删除
  const handleDelete = useCallback((type: ImageType) => {
    if (type === "element") {
      setElementImage(null)
    } else {
      setBaseImage(null)
    }
  }, [])

  const canContinue = elementImage && baseImage

  // 处理继续
  const handleContinue = () => {
    if (elementImage && baseImage) {
      setIsLoading(true)
      console.log("[Upload] Calling onImagesUploaded callback")
      // 延迟以确保 UI 更新
      setTimeout(() => {
        onImagesUploaded(elementImage, baseImage)
      }, 50)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight">Upload Your Images</h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            Upload the element source image and the base image you want to edit
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <UploadCard
            title="A: Element Image"
            description="The source of elements you want to use"
            image={elementImage}
            onDrop={(e) => handleDrop(e, "element")}
            onFileSelect={(e) => handleFileSelect(e, "element")}
            onDelete={() => handleDelete("element")}
            inputId="element-upload"
          />

          <UploadCard
            title="B: Base Image"
            description="The image you want to edit"
            image={baseImage}
            onDrop={(e) => handleDrop(e, "base")}
            onFileSelect={(e) => handleFileSelect(e, "base")}
            onDelete={() => handleDelete("base")}
            inputId="base-upload"
          />
        </div>

        <div className="mb-8 flex w-full justify-center">
          <Button
            size="lg"
            disabled={!canContinue || isProcessing || isLoading}
            onClick={handleContinue}
            className="min-w-[240px] px-12 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading Editor...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Editor"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ 子组件 ============

interface UploadCardProps {
  title: string
  description: string
  image: string | null
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
  inputId: string
}

function UploadCard({
  title,
  description,
  image,
  onDrop,
  onFileSelect,
  onDelete,
  inputId,
}: UploadCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
        >
          {image ? (
            <ImagePreview
              image={image}
              title={title}
              inputId={inputId}
              onFileSelect={onFileSelect}
              onDelete={onDelete}
            />
          ) : (
            <UploadPrompt inputId={inputId} onFileSelect={onFileSelect} />
          )}
        </div>
      </div>
    </Card>
  )
}

interface ImagePreviewProps {
  image: string
  title: string
  inputId: string
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
}

function ImagePreview({ image, title, inputId, onFileSelect, onDelete }: ImagePreviewProps) {
  return (
    <div className="relative h-full w-full">
      <img src={image} alt={title} className="h-full w-full object-contain" />
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <label htmlFor={`${inputId}-replace`}>
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <span className="cursor-pointer">
              <RefreshCw className="h-4 w-4" />
              Replace
            </span>
          </Button>
        </label>
        <Button variant="destructive" size="sm" onClick={onDelete} className="gap-2">
          <X className="h-4 w-4" />
          Delete
        </Button>
      </div>
      <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
      </div>
      <input
        id={`${inputId}-replace`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelect}
      />
    </div>
  )
}

interface UploadPromptProps {
  inputId: string
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function UploadPrompt({ inputId, onFileSelect }: UploadPromptProps) {
  return (
    <>
      <label
        htmlFor={inputId}
        className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <div className="rounded-full bg-primary/10 p-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">Drop image here or click to upload</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
        </div>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelect}
      />
    </>
  )
}
