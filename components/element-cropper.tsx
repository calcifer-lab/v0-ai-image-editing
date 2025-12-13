"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Crop, RefreshCcw } from "lucide-react"
import type { CropRegion } from "./image-editor"

interface ElementCropperProps {
  image: string
  crop: CropRegion | null
  onCropChange: (crop: CropRegion | null) => void
}

export default function ElementCropper({ image, crop, onCropChange }: ElementCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [draftSelection, setDraftSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const setFullCrop = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return
    onCropChange({
      x: 0,
      y: 0,
      width: naturalSize.width,
      height: naturalSize.height,
      imageWidth: naturalSize.width,
      imageHeight: naturalSize.height,
    })
  }, [naturalSize, onCropChange])

  useEffect(() => {
    // Reset draft when crop changes externally
    setDraftSelection(null)
  }, [crop])

  const displayedSelection = useMemo(() => {
    const img = imgRef.current
    if (!img) return null

    const rect = img.getBoundingClientRect()
    const reference = draftSelection || (crop
      ? {
          x: (crop.x / crop.imageWidth) * rect.width,
          y: (crop.y / crop.imageHeight) * rect.height,
          width: (crop.width / crop.imageWidth) * rect.width,
          height: (crop.height / crop.imageHeight) * rect.height,
        }
      : null)

    if (!reference) return null

    return {
      x: reference.x,
      y: reference.y,
      width: reference.width,
      height: reference.height,
    }
  }, [crop, draftSelection])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight })
    if (!crop) {
      setFullCrop()
    }
  }

  const clampToImage = (clientX: number, clientY: number) => {
    const img = imgRef.current
    if (!img) return { x: 0, y: 0, valid: false }
    const rect = img.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height)
    return { x, y, rect, valid: true }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y, valid } = clampToImage(e.clientX, e.clientY)
    if (!valid) return
    setIsDragging(true)
    dragStart.current = { x, y }
    setDraftSelection({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return
    const { x, y, valid } = clampToImage(e.clientX, e.clientY)
    if (!valid) return
    const start = dragStart.current
    const width = Math.abs(x - start.x)
    const height = Math.abs(y - start.y)
    const selX = Math.min(x, start.x)
    const selY = Math.min(y, start.y)
    setDraftSelection({ x: selX, y: selY, width, height })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !draftSelection || !naturalSize.width || !naturalSize.height) {
      setIsDragging(false)
      return
    }
    setIsDragging(false)
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()

    const scaleX = naturalSize.width / rect.width
    const scaleY = naturalSize.height / rect.height

    const nextCrop: CropRegion = {
      x: Math.round(draftSelection.x * scaleX),
      y: Math.round(draftSelection.y * scaleY),
      width: Math.max(1, Math.round(draftSelection.width * scaleX)),
      height: Math.max(1, Math.round(draftSelection.height * scaleY)),
      imageWidth: naturalSize.width,
      imageHeight: naturalSize.height,
    }

    onCropChange(nextCrop)
    setDraftSelection(null)
    dragStart.current = null
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Crop className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-semibold">Element Crop</h3>
            <p className="text-xs text-muted-foreground">Used only for Direct Paste</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={setFullCrop} disabled={!naturalSize.width}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="p-4">
        <Label className="mb-2 block text-xs text-muted-foreground">
          Drag to select the exact part of the element image to paste.
        </Label>
        <div
          className="relative mx-auto max-h-[320px] w-full max-w-[640px] overflow-hidden rounded-lg border"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false)
              setDraftSelection(null)
            }
          }}
          style={{ cursor: "crosshair" }}
        >
          <img
            ref={imgRef}
            src={image}
            alt="Element to crop"
            className="block h-auto w-full select-none"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />

          {displayedSelection && displayedSelection.width > 2 && displayedSelection.height > 2 && (
            <>
              <div
                className="absolute border-2 border-primary/80 bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                style={{
                  left: displayedSelection.x,
                  top: displayedSelection.y,
                  width: displayedSelection.width,
                  height: displayedSelection.height,
                  pointerEvents: "none",
                }}
              />
              <div
                className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white"
                style={{ pointerEvents: "none" }}
              >
                {Math.round(displayedSelection.width)} × {Math.round(displayedSelection.height)} px
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
