"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Pencil, Eraser, Square, Circle, Undo, Redo, Trash2 } from "lucide-react"
import type { MaskData } from "./image-editor"

interface CanvasEditorProps {
  elementImage: string
  baseImage: string
  onMaskCreated: (mask: MaskData) => void
}

type Tool = "brush" | "eraser" | "rectangle" | "circle"

export default function CanvasEditor({ elementImage, baseImage, onMaskCreated }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>("brush")
  const [brushSize, setBrushSize] = useState(20)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const isInitialized = useRef(false)

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas || !baseImageRef.current) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    // Clear and redraw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height)

    // Draw mask overlay with blue tint using a temporary canvas
    // We use a temp canvas because putImageData replaces pixels instead of blending
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = maskCanvas.width
    tempCanvas.height = maskCanvas.height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const data = maskImageData.data
    const overlayData = tempCtx.createImageData(maskCanvas.width, maskCanvas.height)

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255) {
        // White pixels in mask = selected region (show blue overlay)
        overlayData.data[i] = 59 // Primary blue
        overlayData.data[i + 1] = 130
        overlayData.data[i + 2] = 246
        overlayData.data[i + 3] = 128 // 50% opacity
      } else {
        overlayData.data[i + 3] = 0 // Transparent
      }
    }

    // Put overlay data to temp canvas, then draw it on main canvas with blending
    tempCtx.putImageData(overlayData, 0, 0)
    ctx.drawImage(tempCanvas, 0, 0)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas || isInitialized.current) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const maxWidth = 800
      const maxHeight = 600
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height
      maskCanvas.width = width
      maskCanvas.height = height

      ctx.drawImage(img, 0, 0, width, height)
      baseImageRef.current = img

      // Initialize mask canvas (black = unselected)
      maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
      maskCtx.fillRect(0, 0, width, height)

      // Save initial state
      const initialState = maskCtx.getImageData(0, 0, width, height)
      setHistory([initialState])
      setHistoryIndex(0)

      isInitialized.current = true
    }
    img.src = baseImage
  }, [baseImage])

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
    [historyIndex],
  )

  const undo = () => {
    if (historyIndex > 0) {
      const maskCanvas = maskCanvasRef.current
      if (!maskCanvas) return
      const maskCtx = maskCanvas.getContext("2d")
      if (!maskCtx) return

      setHistoryIndex(historyIndex - 1)
      maskCtx.putImageData(history[historyIndex - 1], 0, 0)
      redrawCanvas()
      updateMask()
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const maskCanvas = maskCanvasRef.current
      if (!maskCanvas) return
      const maskCtx = maskCanvas.getContext("2d")
      if (!maskCtx) return

      setHistoryIndex(historyIndex + 1)
      maskCtx.putImageData(history[historyIndex + 1], 0, 0)
      redrawCanvas()
      updateMask()
    }
  }

  const clearMask = () => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    saveToHistory(maskCanvas)
    redrawCanvas()
    updateMask()
  }

  const updateMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const dataUrl = maskCanvas.toDataURL()

    // Calculate bounding box of the mask
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
        // Check if pixel is white (selected area)
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
      onMaskCreated({
        dataUrl,
        coordinates: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      })
    }
  }, [onMaskCreated])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      const maskCanvas = maskCanvasRef.current
      if (maskCanvas) {
        saveToHistory(maskCanvas)
        updateMask()
      }
    }
    setIsDrawing(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return

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

    if (tool === "brush" || tool === "eraser") {
      maskCtx.beginPath()
      maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2)

      if (tool === "brush") {
        maskCtx.fillStyle = "rgba(255, 255, 255, 1)"
      } else {
        maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
      }

      maskCtx.fill()
    }

    // Redraw canvas with updated mask
    redrawCanvas()
  }

  return (
    <Card className="flex flex-col">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Select Region to Edit</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearMask}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={tool} onValueChange={(v) => setTool(v as Tool)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="brush" className="gap-2">
              <Pencil className="h-4 w-4" />
              Brush
            </TabsTrigger>
            <TabsTrigger value="eraser" className="gap-2">
              <Eraser className="h-4 w-4" />
              Eraser
            </TabsTrigger>
            <TabsTrigger value="rectangle" className="gap-2" disabled>
              <Square className="h-4 w-4" />
              Rectangle
            </TabsTrigger>
            <TabsTrigger value="circle" className="gap-2" disabled>
              <Circle className="h-4 w-4" />
              Circle
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Brush Size</span>
            <span className="font-medium">{brushSize}px</span>
          </div>
          <Slider value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} min={5} max={100} step={5} />
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair rounded-lg border shadow-lg"
            style={{ maxWidth: "100%", maxHeight: "min(400px, 50vh)", height: "auto" }}
          />
          <canvas ref={maskCanvasRef} className="hidden" />
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary" />
          <span className="text-sm text-muted-foreground">
            Selected region (will be replaced with AI-generated content)
          </span>
        </div>
      </div>
    </Card>
  )
}
