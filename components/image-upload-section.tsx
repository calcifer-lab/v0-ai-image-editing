"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, X, RefreshCw } from "lucide-react"

interface ImageUploadSectionProps {
  onImagesUploaded: (elementImage: string, baseImage: string) => void
}

export default function ImageUploadSection({ onImagesUploaded }: ImageUploadSectionProps) {
  const [elementImage, setElementImage] = useState<string | null>(null)
  const [baseImage, setBaseImage] = useState<string | null>(null)

  console.log("[v0] Upload section - Element image:", elementImage ? "loaded" : "null")
  console.log("[v0] Upload section - Base image:", baseImage ? "loaded" : "null")

  const handleFileUpload = useCallback((file: File, type: "element" | "base") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === "element") {
        setElementImage(result)
      } else {
        setBaseImage(result)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "element" | "base") => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file, type)
      }
    },
    [handleFileUpload],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "element" | "base") => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileUpload(file, type)
      }
    },
    [handleFileUpload],
  )

  const handleDelete = useCallback((type: "element" | "base") => {
    if (type === "element") {
      setElementImage(null)
    } else {
      setBaseImage(null)
    }
  }, [])

  const canContinue = elementImage && baseImage

  console.log("[v0] Can continue:", canContinue)

  const handleContinue = () => {
    console.log("[v0] Continue button clicked")
    console.log("[v0] Element image:", elementImage ? "loaded" : "null")
    console.log("[v0] Base image:", baseImage ? "loaded" : "null")
    if (elementImage && baseImage) {
      console.log("[v0] Calling onImagesUploaded callback")
      onImagesUploaded(elementImage, baseImage)
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
          {/* Element Image Upload */}
          <UploadCard
            title="A: Element Image"
            description="The source of elements you want to use"
            image={elementImage}
            onDrop={(e) => handleDrop(e, "element")}
            onFileSelect={(e) => handleFileSelect(e, "element")}
            onDelete={() => handleDelete("element")}
            inputId="element-upload"
          />

          {/* Base Image Upload */}
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
          <Button size="lg" disabled={!canContinue} onClick={handleContinue} className="px-12 py-6 text-lg">
            Continue to Editor
          </Button>
        </div>
      </div>
    </div>
  )
}

function UploadCard({
  title,
  description,
  image,
  onDrop,
  onFileSelect,
  onDelete,
  inputId,
}: {
  title: string
  description: string
  image: string | null
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: () => void
  inputId: string
}) {
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
            <div className="relative h-full w-full">
              <img src={image || "/placeholder.svg"} alt={title} className="h-full w-full object-contain" />
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
          ) : (
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
          )}
          {!image && <input id={inputId} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />}
        </div>
      </div>
    </Card>
  )
}
