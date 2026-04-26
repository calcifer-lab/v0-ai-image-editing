"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Crop, RefreshCcw, Pencil, Eraser, Undo, Redo } from "lucide-react"
import type { CropRegion } from "@/types"

interface ElementCropperProps {
  image: string
  crop: CropRegion | null
  onCropChange: (crop: CropRegion | null) => void
}

type Tool = "brush" | "eraser"

const MASK_OVERLAY_COLOR = { r: 59, g: 130, b: 246 }
const MASK_OVERLAY_ALPHA = 128
const MAX_DISPLAY_HEIGHT = 400

function getDisplayDimensions(width: number, height: number) {
  const scale = Math.min(1, MAX_DISPLAY_HEIGHT / height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

export default function ElementCropper({ image, crop, onCropChange }: ElementCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [tool, setTool] = useState<Tool>("brush")
  const [brushSize, setBrushSize] = useState(80)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

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

  const initializeCanvas = useCallback(
    (img: HTMLImageElement, initialSelection: "empty" | "full" = "empty") => {
      const canvas = canvasRef.current
      const maskCanvas = maskCanvasRef.current
      if (!canvas || !maskCanvas) return

      const { width: displayWidth, height: displayHeight } = getDisplayDimensions(img.naturalWidth, img.naturalHeight)

      canvas.width = displayWidth
      canvas.height = displayHeight
      maskCanvas.width = displayWidth
      maskCanvas.height = displayHeight

      const ctx = canvas.getContext("2d")
      const maskCtx = maskCanvas.getContext("2d")
      if (!ctx || !maskCtx) return

      ctx.clearRect(0, 0, displayWidth, displayHeight)
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

      maskCtx.clearRect(0, 0, displayWidth, displayHeight)
      maskCtx.fillStyle = initialSelection === "full" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)"
      maskCtx.fillRect(0, 0, displayWidth, displayHeight)

      const initialState = maskCtx.getImageData(0, 0, displayWidth, displayHeight)
      setHistory([initialState])
      setHistoryIndex(0)

      if (initialSelection === "full") {
        onCropChange({
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
        })
      } else {
        onCropChange(null)
      }
    },
    [onCropChange]
  )

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

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Shift+Z / Ctrl+Y = redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

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

    // First pass: find exact bounding box of white pixels
    const whitePixels: { x: number; y: number }[] = []
    for (let y = 0; y < maskCanvas.height; y++) {
      for (let x = 0; x < maskCanvas.width; x++) {
        const i = (y * maskCanvas.width + x) * 4
        if (data[i] === 255) {
          hasSelection = true
          whitePixels.push({ x, y })
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    // Optional: Remove outlier pixels (top/bottom 2% of pixels based on density)
    // This helps if user accidentally painted in unwanted areas
    if (whitePixels.length > 100) {
      // Calculate density in regions to detect sparse outliers
      const regionSize = 20 // pixels
      const densityMap = new Map<string, number>()

      whitePixels.forEach(({ x, y }) => {
        const rx = Math.floor(x / regionSize)
        const ry = Math.floor(y / regionSize)
        const key = `${rx},${ry}`
        densityMap.set(key, (densityMap.get(key) || 0) + 1)
      })

      // Find regions with low density (potential outliers)
      const avgDensity = Array.from(densityMap.values()).reduce((a, b) => a + b, 0) / densityMap.size
      const threshold = avgDensity * 0.15 // Regions with <15% of average density are outliers

      // Recalculate bounds excluding sparse regions
      let filteredMinX = maskCanvas.width
      let filteredMinY = maskCanvas.height
      let filteredMaxX = 0
      let filteredMaxY = 0
      let hasFiltered = false

      whitePixels.forEach(({ x, y }) => {
        const rx = Math.floor(x / regionSize)
        const ry = Math.floor(y / regionSize)
        const key = `${rx},${ry}`
        const density = densityMap.get(key) || 0

        if (density >= threshold) {
          hasFiltered = true
          filteredMinX = Math.min(filteredMinX, x)
          filteredMinY = Math.min(filteredMinY, y)
          filteredMaxX = Math.max(filteredMaxX, x)
          filteredMaxY = Math.max(filteredMaxY, y)
        }
      })

      // Use filtered bounds if they're significantly tighter (at least 5% reduction)
      if (hasFiltered) {
        const originalArea = (maxX - minX + 1) * (maxY - minY + 1)
        const filteredArea = (filteredMaxX - filteredMinX + 1) * (filteredMaxY - filteredMinY + 1)

        if (filteredArea < originalArea * 0.95 && filteredArea > 0) {
          console.log("[ElementCropper] Outlier removal reduced area by", ((1 - filteredArea / originalArea) * 100).toFixed(1), "%")
          minX = filteredMinX
          minY = filteredMinY
          maxX = filteredMaxX
          maxY = filteredMaxY
        }
      }
    }

    if (hasSelection) {
      // Apply a small inward padding to avoid edge artifacts (2-5 pixels depending on brush size)
      // This helps exclude accidentally painted edge pixels
      const paddingX = Math.max(1, Math.min(3, Math.floor((maxX - minX) * 0.02)))
      const paddingY = Math.max(1, Math.min(3, Math.floor((maxY - minY) * 0.02)))

      minX = Math.min(minX + paddingX, maxX)
      minY = Math.min(minY + paddingY, maxY)
      maxX = Math.max(maxX - paddingX, minX)
      maxY = Math.max(maxY - paddingY, minY)

      // 将 maskCanvas 坐标（显示尺寸）转换为原始图片坐标
      const scaleX = naturalSize.width / maskCanvas.width
      const scaleY = naturalSize.height / maskCanvas.height

      const cropX = Math.round(minX * scaleX)
      const cropY = Math.round(minY * scaleY)
      const cropWidth = Math.round((maxX - minX + 1) * scaleX)
      const cropHeight = Math.round((maxY - minY + 1) * scaleY)

      console.log("[ElementCropper] Crop region (display, with padding):", minX, minY, maxX - minX + 1, maxY - minY + 1)
      console.log("[ElementCropper] Crop region (natural):", cropX, cropY, cropWidth, cropHeight)

      onCropChange({
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
        imageWidth: naturalSize.width,
        imageHeight: naturalSize.height,
      })
    } else {
      onCropChange(null)
    }
  }, [naturalSize, onCropChange])

  const setFullCrop = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return
    maskCtx.fillStyle = "rgba(255, 255, 255, 1)"
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    saveToHistory(maskCanvas)
    redrawCanvas()
    updateCropFromMask()
  }, [naturalSize, onCropChange, saveToHistory, redrawCanvas, updateCropFromMask])


  // Re-initialize canvas when switching to brush/eraser mode
  useEffect(() => {
    if (tool === "brush" || tool === "eraser") {
      const img = imgRef.current
      if (!img || !img.complete || !img.naturalWidth) return

      if (historyIndex < 0) {
        initializeCanvas(img, crop ? "empty" : "full")
      } else {
        redrawCanvas()
      }
    }
  }, [tool, crop, historyIndex, initializeCanvas, redrawCanvas])


  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight })
    setIsDragging(false)
    initializeCanvas(target, crop ? "empty" : "full")
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
    setIsDragging(true)
    drawBrush(e as React.MouseEvent<HTMLCanvasElement>)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    drawBrush(e as React.MouseEvent<HTMLCanvasElement>)
  }

  const handleMouseUp = () => {
    if (isDragging) {
      const maskCanvas = maskCanvasRef.current
      if (maskCanvas) {
        saveToHistory(maskCanvas)
        updateCropFromMask()
      }
    }
    setIsDragging(false)
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-semibold">Element Crop</h3>
              <p className="text-xs text-muted-foreground">Select ONLY the element to patch</p>
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
          <TabsList className="grid w-full grid-cols-2">
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
          "Paint to select the element you want to use"
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
          <img
            ref={imgRef}
            src={image}
            alt="Element"
            className="absolute opacity-0 pointer-events-none"
            style={{ maxHeight: "400px" }}
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            className="block max-w-full cursor-crosshair rounded-lg"
            style={{ maxHeight: "400px" }}
          />
          <canvas ref={maskCanvasRef} className="hidden" />
        </div>
      </div>
    </Card>
  )
}
