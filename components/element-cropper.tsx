"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Crop, RefreshCcw, Pencil, Eraser, Square, Undo, Redo } from "lucide-react"
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

type Tool = "selection" | "brush" | "eraser"

const DEFAULT_SELECTION_SIZE = 0.3
const MIN_SELECTION_SIZE = 3
const MASK_OVERLAY_COLOR = { r: 59, g: 130, b: 246 }
const MASK_OVERLAY_ALPHA = 128
export default function ElementCropper({ image, crop, onCropChange }: ElementCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [draftSelection, setDraftSelection] = useState<Selection | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [tool, setTool] = useState<Tool>("selection")
  const [brushSize, setBrushSize] = useState(20)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isInitialized = useRef(false)

  // Redraw canvas with mask overlay
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const img = imgRef.current
    if (!canvas || !maskCanvas || !img) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const overlayCanvas = document.createElement("canvas")
    overlayCanvas.width = maskCanvas.width
    overlayCanvas.height = maskCanvas.height
    const overlayCtx = overlayCanvas.getContext("2d")
    if (!overlayCtx) return

    const overlayData = overlayCtx.createImageData(maskCanvas.width, maskCanvas.height)
    for (let i = 0; i < maskImageData.data.length; i += 4) {
      if (maskImageData.data[i] === 255) {
        overlayData.data[i] = MASK_OVERLAY_COLOR.r
        overlayData.data[i + 1] = MASK_OVERLAY_COLOR.g
        overlayData.data[i + 2] = MASK_OVERLAY_COLOR.b
        overlayData.data[i + 3] = MASK_OVERLAY_ALPHA
      } else {
        overlayData.data[i + 3] = 0
      }
    }
    overlayCtx.putImageData(overlayData, 0, 0)
    ctx.drawImage(overlayCanvas, 0, 0)
  }, [])

  // Save to history
  const saveToHistory = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(imageData)
        return newHistory
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex]
  )

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    setHistoryIndex(historyIndex - 1)
    maskCtx.putImageData(history[historyIndex - 1], 0, 0)
    redrawCanvas()
    updateCropFromMask()
  }, [historyIndex, history, redrawCanvas])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    setHistoryIndex(historyIndex + 1)
    maskCtx.putImageData(history[historyIndex + 1], 0, 0)
    redrawCanvas()
    updateCropFromMask()
  }, [historyIndex, history, redrawCanvas])

  // Update crop region from mask
  const updateCropFromMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas || !naturalSize.width || !naturalSize.height) return

    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const data = imageData.data

    let minX = maskCanvas.width
    let minY = maskCanvas.height
    let maxX = 0
    let maxY = 0
    let hasSelection = false

    for (let y = 0; y < maskCanvas.height; y++) {
      for (let x = 0; x < maskCanvas.width; x++) {
        const i = (y * maskCanvas.width + x) * 4
        if (data[i] === 255) {
          hasSelection = true
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    if (hasSelection) {
      onCropChange({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        imageWidth: naturalSize.width,
        imageHeight: naturalSize.height,
      })
    }
  }, [naturalSize, onCropChange])

  const setFullCrop = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return

    // If in brush mode, fill the entire mask
    if (tool === "brush" || tool === "eraser") {
      const maskCanvas = maskCanvasRef.current
      if (maskCanvas) {
        const maskCtx = maskCanvas.getContext("2d")
        if (maskCtx) {
          maskCtx.fillStyle = "rgba(255, 255, 255, 1)"
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
          saveToHistory(maskCanvas)
          redrawCanvas()
          updateCropFromMask()
          return
        }
      }
    }

    onCropChange({
      x: 0,
      y: 0,
      width: naturalSize.width,
      height: naturalSize.height,
      imageWidth: naturalSize.width,
      imageHeight: naturalSize.height,
    })
  }, [naturalSize, onCropChange, tool, saveToHistory, redrawCanvas, updateCropFromMask])

  useEffect(() => {
    setDraftSelection(null)
  }, [crop])

  // Re-initialize canvas when switching to brush/eraser mode
  useEffect(() => {
    if (tool === "brush" || tool === "eraser") {
      const canvas = canvasRef.current
      const maskCanvas = maskCanvasRef.current
      const img = imgRef.current
      if (!canvas || !maskCanvas || !img || !img.complete || !img.naturalWidth) return

      // Use natural dimensions scaled to display size
      const maxHeight = Math.min(400, window.innerHeight * 0.5)
      const scale = Math.min(1, maxHeight / img.naturalHeight)
      const displayWidth = img.naturalWidth * scale
      const displayHeight = img.naturalHeight * scale

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth
        canvas.height = displayHeight
        maskCanvas.width = displayWidth
        maskCanvas.height = displayHeight

        const ctx = canvas.getContext("2d")
        const maskCtx = maskCanvas.getContext("2d")
        if (ctx && maskCtx) {
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight)
          maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
          maskCtx.fillRect(0, 0, displayWidth, displayHeight)

          const initialState = maskCtx.getImageData(0, 0, displayWidth, displayHeight)
          setHistory([initialState])
          setHistoryIndex(0)
        }
      } else {
        redrawCanvas()
      }
    }
  }, [tool, redrawCanvas])

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

    // Initialize canvases for brush mode
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (canvas && maskCanvas && !isInitialized.current) {
      const rect = target.getBoundingClientRect()
      const displayWidth = rect.width
      const displayHeight = rect.height

      canvas.width = displayWidth
      canvas.height = displayHeight
      maskCanvas.width = displayWidth
      maskCanvas.height = displayHeight

      const ctx = canvas.getContext("2d")
      const maskCtx = maskCanvas.getContext("2d")
      if (ctx && maskCtx) {
        ctx.drawImage(target, 0, 0, displayWidth, displayHeight)
        maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
        maskCtx.fillRect(0, 0, displayWidth, displayHeight)

        const initialState = maskCtx.getImageData(0, 0, displayWidth, displayHeight)
        setHistory([initialState])
        setHistoryIndex(0)
        isInitialized.current = true
      }
    }

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

  // Brush drawing handler
  const drawBrush = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging && e.type !== "mousedown") return
      if (tool !== "brush" && tool !== "eraser") return

      const canvas = canvasRef.current
      const maskCanvas = maskCanvasRef.current
      if (!canvas || !maskCanvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      const maskCtx = maskCanvas.getContext("2d")
      if (!maskCtx) return

      maskCtx.beginPath()
      maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
      maskCtx.fillStyle = tool === "brush" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)"
      maskCtx.fill()

      redrawCanvas()
    },
    [isDragging, tool, brushSize, redrawCanvas]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "brush" || tool === "eraser") {
      setIsDragging(true)
      drawBrush(e as React.MouseEvent<HTMLCanvasElement>)
      return
    }

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
    if (tool === "brush" || tool === "eraser") {
      drawBrush(e as React.MouseEvent<HTMLCanvasElement>)
      return
    }

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
    if (tool === "brush" || tool === "eraser") {
      if (isDragging) {
        const maskCanvas = maskCanvasRef.current
        if (maskCanvas) {
          saveToHistory(maskCanvas)
          updateCropFromMask()
        }
      }
      setIsDragging(false)
      return
    }

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
      <div className="border-b px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-semibold">Element Crop</h3>
              <p className="text-xs text-muted-foreground">Select ONLY the element to paste</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={setFullCrop} disabled={!naturalSize.width}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <Tabs value={tool} onValueChange={(v) => setTool(v as Tool)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection" className="gap-2">
              <Square className="h-4 w-4" />
              Box
            </TabsTrigger>
            <TabsTrigger value="brush" className="gap-2">
              <Pencil className="h-4 w-4" />
              Brush
            </TabsTrigger>
            <TabsTrigger value="eraser" className="gap-2">
              <Eraser className="h-4 w-4" />
              Eraser
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {(tool === "brush" || tool === "eraser") && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Brush Size</span>
              <span className="font-medium">{brushSize}px</span>
            </div>
            <Slider value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} min={5} max={100} step={5} />
          </div>
        )}
      </div>

      <div className="p-4">
        <Label className="mb-3 block text-xs text-muted-foreground">
          {tool === "selection"
            ? "Click or drag to select the element area"
            : "Paint to select the element you want to transfer"}
        </Label>
        <div
          className="relative mx-auto w-fit cursor-crosshair overflow-hidden rounded-lg border bg-muted/30"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging) {
              handleMouseUp()
            }
          }}
        >
          {tool === "selection" ? (
            <>
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
                  <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                    {Math.round(displayedSelection.width)} × {Math.round(displayedSelection.height)} px
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <img
                ref={imgRef}
                src={image}
                alt="Element to crop"
                className="absolute opacity-0 pointer-events-none"
                style={{ maxHeight: "min(400px, 50vh)" }}
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className="block max-w-full cursor-crosshair rounded-lg"
                style={{ maxHeight: "min(400px, 50vh)" }}
              />
              <canvas ref={maskCanvasRef} className="hidden" />
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
