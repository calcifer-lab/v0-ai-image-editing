"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Crop, RefreshCcw } from "lucide-react"
import type { CropRegion } from "@/types"

interface ElementCropperProps {
  image: string
  crop: CropRegion | null
  onCropChange: (crop: CropRegion | null) => void
}

interface Selection {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_SELECTION_SIZE = 0.3
const MIN_SELECTION_SIZE = 3
export default function ElementCropper({ image, crop, onCropChange }: ElementCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [draftSelection, setDraftSelection] = useState<Selection | null>(null)
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
    setDraftSelection(null)
  }, [crop])

  const displayedSelection = useMemo(() => {
    const img = imgRef.current
    if (!img) return null

    const rect = img.getBoundingClientRect()
    const reference =
      draftSelection ||
      (crop
        ? {
            x: (crop.x / crop.imageWidth) * rect.width,
            y: (crop.y / crop.imageHeight) * rect.height,
            width: (crop.width / crop.imageWidth) * rect.width,
            height: (crop.height / crop.imageHeight) * rect.height,
          }
        : null)

    return reference
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
    if (!img) return { x: 0, y: 0, rect: null as DOMRect | null, valid: false }
    const rect = img.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height)
    return { x, y, rect, valid: true }
  }

  const isInsideSelection = (x: number, y: number, sel: Selection) => {
    return x >= sel.x && x <= sel.x + sel.width && y >= sel.y && y <= sel.y + sel.height
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y, valid } = clampToImage(e.clientX, e.clientY)
    if (!valid) return

    if (displayedSelection && isInsideSelection(x, y, displayedSelection)) {
      setIsDragging(true)
      dragStart.current = { x, y }
      setDraftSelection({ ...displayedSelection })
    } else {
      setIsDragging(true)
      dragStart.current = { x, y }
      setDraftSelection({ x, y, width: 0, height: 0 })
    }
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

  const handleMouseUp = () => {
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

    if (draftSelection.width < MIN_SELECTION_SIZE && draftSelection.height < MIN_SELECTION_SIZE) {
      const defaultWidth = rect.width * DEFAULT_SELECTION_SIZE
      const defaultHeight = rect.height * DEFAULT_SELECTION_SIZE

      const centerX = draftSelection.x
      const centerY = draftSelection.y
      const x = Math.max(0, Math.min(centerX - defaultWidth / 2, rect.width - defaultWidth))
      const y = Math.max(0, Math.min(centerY - defaultHeight / 2, rect.height - defaultHeight))

      const nextCrop: CropRegion = {
        x: Math.round(x * scaleX),
        y: Math.round(y * scaleY),
        width: Math.round(defaultWidth * scaleX),
        height: Math.round(defaultHeight * scaleY),
        imageWidth: naturalSize.width,
        imageHeight: naturalSize.height,
      }

      onCropChange(nextCrop)
      setDraftSelection(null)
      dragStart.current = null
      return
    }

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
            <h3 className="font-semibold">Element Selection</h3>
            <p className="text-xs text-muted-foreground">
              Select the specific element to transfer
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={setFullCrop} disabled={!naturalSize.width}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="p-4">
        <Label className="mb-3 block text-xs text-muted-foreground">
          Click or drag to select the element you want to paste into the target image.
        </Label>
        <div
          className="relative mx-auto w-fit cursor-crosshair rounded-lg border bg-muted/30"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false)
              setDraftSelection(null)
            }
          }}
        >
          <img
            ref={imgRef}
            src={image}
            alt="Element to crop"
            className="block max-w-full select-none object-contain"
            style={{ maxHeight: "min(400px, 50vh)" }}
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />

          {displayedSelection && displayedSelection.width > 2 && displayedSelection.height > 2 && (
            <>
              <div
                className="pointer-events-none absolute border-2 border-primary/80 bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                style={{
                  left: displayedSelection.x,
                  top: displayedSelection.y,
                  width: displayedSelection.width,
                  height: displayedSelection.height,
                }}
              />
              <div
                className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white"
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
