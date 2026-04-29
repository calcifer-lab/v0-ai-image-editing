"use client"

import { useEffect, useMemo, useState } from "react"
import ElementCropper from "@/components/element-cropper"
import CanvasEditor from "@/components/canvas-editor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { fileToDataUrl, isFileSizeValid, isImageFile } from "@/lib/image-utils"
import type { CropRegion, MaskData } from "@/types"
import { CheckCircle2, Download, ImagePlus, Loader2, RefreshCcw, Sparkles } from "lucide-react"

type EditorState = "upload" | "select_element" | "select_target" | "blending" | "result"

interface ImageAsset {
  src: string
  name: string
  width: number
  height: number
}

interface ImageRegion {
  x: number
  y: number
  width: number
  height: number
}

const MAX_UPLOAD_MB = 20

const STEPS: { id: EditorState; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "select_element", label: "Select Element" },
  { id: "select_target", label: "Select Target" },
  { id: "blending", label: "Blending" },
  { id: "result", label: "Result" },
]

function getStepIndex(step: EditorState) {
  return STEPS.findIndex((item) => item.id === step)
}

function loadImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error("Failed to read image dimensions"))
    image.src = src
  })
}

async function fileToAsset(file: File): Promise<ImageAsset> {
  const src = await fileToDataUrl(file)
  const { width, height } = await loadImageDimensions(src)
  return {
    src,
    name: file.name,
    width,
    height,
  }
}

function scaleMaskToImageRegion(mask: MaskData, image: ImageAsset, displayedWidth: number, displayedHeight: number): ImageRegion {
  const scaleX = image.width / displayedWidth
  const scaleY = image.height / displayedHeight

  return {
    x: Math.round(mask.coordinates.x * scaleX),
    y: Math.round(mask.coordinates.y * scaleY),
    width: Math.round(mask.coordinates.width * scaleX),
    height: Math.round(mask.coordinates.height * scaleY),
  }
}

function clampRegion(region: ImageRegion, image: ImageAsset): ImageRegion {
  const x = Math.max(0, Math.min(region.x, image.width - 1))
  const y = Math.max(0, Math.min(region.y, image.height - 1))
  const width = Math.max(1, Math.min(region.width, image.width - x))
  const height = Math.max(1, Math.min(region.height, image.height - y))

  return { x, y, width, height }
}

function dataUrlToDownloadName(name: string, suffix: string) {
  const baseName = name.replace(/\.[^.]+$/, "") || "transplant"
  return `${baseName}-${suffix}.png`
}

function StepBadge({ active, complete, label }: { active: boolean; complete: boolean; label: string }) {
  return (
    <div
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        complete ? "border-primary bg-primary text-primary-foreground" : "",
        !complete && active ? "border-primary/50 bg-primary/10 text-foreground" : "",
        !complete && !active ? "border-border text-muted-foreground" : "",
      ].join(" ")}
    >
      {complete ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{label}</span> : label}
    </div>
  )
}

function UploadPane({
  title,
  description,
  image,
  onFile,
}: {
  title: string
  description: string
  image: ImageAsset | null
  onFile: (file: File) => Promise<void>
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      setLocalError("Please upload an image file.")
      return
    }

    if (!isFileSizeValid(file, MAX_UPLOAD_MB)) {
      setLocalError(`Please keep uploads under ${MAX_UPLOAD_MB}MB.`)
      return
    }

    setLocalError(null)
    await onFile(file)
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <label
          className={[
            "relative flex min-h-[320px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/30",
          ].join(" ")}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (event) => {
            event.preventDefault()
            setIsDragging(false)
            await handleFiles(event.dataTransfer.files)
          }}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (event) => {
              await handleFiles(event.target.files)
              event.target.value = ""
            }}
          />
          {image ? (
            <div className="flex w-full flex-1 flex-col gap-4">
              <div className="overflow-hidden rounded-lg border bg-background">
                <img src={image.src} alt={image.name} className="max-h-[360px] w-full object-contain" />
              </div>
              <div className="text-left text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{image.name}</p>
                <p>
                  {image.width} × {image.height}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImagePlus className="h-7 w-7" />
              </div>
              <div>
                <p className="font-medium">Drop an image here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to {MAX_UPLOAD_MB}MB</p>
            </div>
          )}
        </label>
        {localError ? <p className="mt-3 text-sm text-destructive">{localError}</p> : null}
      </div>
    </Card>
  )
}

export default function ElementTransplantEditor() {
  const [step, setStep] = useState<EditorState>("upload")
  const [mainImage, setMainImage] = useState<ImageAsset | null>(null)
  const [elementImage, setElementImage] = useState<ImageAsset | null>(null)
  const [elementRegion, setElementRegion] = useState<CropRegion | null>(null)
  const [targetMask, setTargetMask] = useState<MaskData | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canAdvanceFromUpload = Boolean(mainImage && elementImage)
  const canvasDisplaySize = useMemo(() => {
    if (!mainImage) return null

    let width = mainImage.width
    let height = mainImage.height

    if (width > 800) {
      height = (height * 800) / width
      width = 800
    }
    if (height > 999) {
      width = (width * 999) / height
      height = 999
    }

    return { width, height }
  }, [mainImage])

  useEffect(() => {
    if (step !== "upload" || !canAdvanceFromUpload) return
    setStep("select_element")
  }, [step, canAdvanceFromUpload])

  async function handleMainFile(file: File) {
    setError(null)
    setTargetMask(null)
    setResultImage(null)
    setMainImage(await fileToAsset(file))
  }

  async function handleElementFile(file: File) {
    setError(null)
    setElementRegion(null)
    setResultImage(null)
    setElementImage(await fileToAsset(file))
  }

  async function handleBlend() {
    if (!mainImage || !elementImage || !elementRegion || !targetMask || !canvasDisplaySize) return

    setError(null)
    setStep("blending")

    const mainRegion = clampRegion(
      scaleMaskToImageRegion(targetMask, mainImage, canvasDisplaySize.width, canvasDisplaySize.height),
      mainImage
    )
    const selectedElementRegion = clampRegion(
      {
        x: elementRegion.x,
        y: elementRegion.y,
        width: elementRegion.width,
        height: elementRegion.height,
      },
      elementImage
    )

    try {
      const response = await fetch("/api/blend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mainImage: mainImage.src,
          elementImage: elementImage.src,
          mainRegion,
          elementRegion: selectedElementRegion,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Blend request failed")
      }

      setResultImage(payload.result)
      setStep("result")
    } catch (blendError) {
      setError(blendError instanceof Error ? blendError.message : "Failed to blend images")
      setStep("select_target")
    }
  }

  function resetAll() {
    setStep("upload")
    setMainImage(null)
    setElementImage(null)
    setElementRegion(null)
    setTargetMask(null)
    setResultImage(null)
    setError(null)
  }

  function downloadResult() {
    if (!resultImage || !mainImage) return
    const link = document.createElement("a")
    link.href = resultImage
    link.download = dataUrlToDownloadName(mainImage.name, "transplant")
    link.click()
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((item, index) => {
            const currentIndex = getStepIndex(step)
            return (
              <StepBadge
                key={item.id}
                label={item.label}
                active={currentIndex === index}
                complete={currentIndex > index}
              />
            )
          })}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Element Transplant</h1>
          <p className="text-sm text-muted-foreground">
            Upload a main image on the left, extract the correct element from the right, then place it where it belongs.
          </p>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Main Image</h2>
              <p className="text-sm text-muted-foreground">The image that needs fixing.</p>
            </div>
            {step === "select_target" ? (
              <Button variant="outline" size="sm" onClick={() => setTargetMask(null)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Clear Target
              </Button>
            ) : null}
          </div>

          {step === "upload" || !mainImage ? (
            <UploadPane
              title="Main image"
              description="Upload the image that contains the area you want to repair."
              image={mainImage}
              onFile={handleMainFile}
            />
          ) : step === "select_target" && mainImage && elementImage ? (
            <CanvasEditor
              baseImage={mainImage.src}
              elementImage={elementImage.src}
              onMaskCreated={setTargetMask}
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="border-b px-5 py-4">
                <h3 className="font-semibold">{mainImage.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mainImage.width} × {mainImage.height}
                </p>
              </div>
              <div className="p-5">
                <div className="overflow-hidden rounded-lg border bg-muted/20">
                  <img src={step === "result" && resultImage ? resultImage : mainImage.src} alt="Main preview" className="max-h-[720px] w-full object-contain" />
                </div>
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Element Image</h2>
              <p className="text-sm text-muted-foreground">The image that contains the correct element to transplant.</p>
            </div>
            {step === "select_element" ? (
              <Button variant="outline" size="sm" onClick={() => setElementRegion(null)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Clear Selection
              </Button>
            ) : null}
          </div>

          {step === "upload" || !elementImage ? (
            <UploadPane
              title="Element image"
              description="Upload the image that has the element you want to extract."
              image={elementImage}
              onFile={handleElementFile}
            />
          ) : step === "select_element" && elementImage ? (
            <ElementCropper image={elementImage.src} crop={elementRegion} onCropChange={setElementRegion} />
          ) : (
            <Card className="overflow-hidden">
              <div className="border-b px-5 py-4">
                <h3 className="font-semibold">{elementImage.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {elementImage.width} × {elementImage.height}
                </p>
              </div>
              <div className="p-5">
                <div className="overflow-hidden rounded-lg border bg-muted/20">
                  <img src={elementImage.src} alt="Element preview" className="max-h-[720px] w-full object-contain" />
                </div>
                {elementRegion ? (
                  <div className="mt-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    Selected region: x {elementRegion.x}, y {elementRegion.y}, w {elementRegion.width}, h {elementRegion.height}
                  </div>
                ) : null}
              </div>
            </Card>
          )}
        </section>
      </div>

      <Card className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {step === "upload" ? "Upload both images to begin." : null}
          {step === "select_element" ? "Paint over the element to extract from the right image." : null}
          {step === "select_target" ? "Paint or draw the placement area on the left image." : null}
          {step === "blending" ? "Blending the selected element into the target region." : null}
          {step === "result" ? "Download the result or start over with a new transplant." : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={resetAll}>
            Reset
          </Button>

          {step === "select_element" ? (
            <Button onClick={() => setStep("select_target")} disabled={!elementRegion}>
              Continue to Target
            </Button>
          ) : null}

          {step === "select_target" ? (
            <Button onClick={handleBlend} disabled={!targetMask}>
              <Sparkles className="mr-2 h-4 w-4" />
              Blend Element
            </Button>
          ) : null}

          {step === "blending" ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Blending
            </Button>
          ) : null}

          {step === "result" ? (
            <Button onClick={downloadResult} disabled={!resultImage}>
              <Download className="mr-2 h-4 w-4" />
              Download Result
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
