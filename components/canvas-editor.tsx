"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Pencil, Eraser, Square, Circle, Undo, Redo, Trash2 } from "lucide-react"
import type { MaskData } from "@/types"

interface CanvasEditorProps {
  elementImage: string
  baseImage: string
  onMaskCreated: (mask: MaskData | null) => void
}

type Tool = "brush" | "eraser" | "rectangle" | "circle"

const MAX_CANVAS_WIDTH = 800
const MAX_CANVAS_HEIGHT = 600
const MASK_OVERLAY_COLOR = { r: 59, g: 130, b: 246 } // Primary blue
const MASK_OVERLAY_ALPHA = 128

export default function CanvasEditor({ elementImage, baseImage, onMaskCreated }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>("brush")
  const [brushSize, setBrushSize] = useState(80)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const baseImageRef = useRef<HTMLImageElement | null>(null)

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas || !baseImageRef.current) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height)

    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = maskCanvas.width
    tempCanvas.height = maskCanvas.height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const overlayData = tempCtx.createImageData(maskCanvas.width, maskCanvas.height)

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

    tempCtx.putImageData(overlayData, 0, 0)
    ctx.drawImage(tempCanvas, 0, 0)
  }, [])

  const initializeCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    let { width, height } = img

    if (width > MAX_CANVAS_WIDTH) {
      height = (height * MAX_CANVAS_WIDTH) / width
      width = MAX_CANVAS_WIDTH
    }
    if (height > MAX_CANVAS_HEIGHT) {
      width = (width * MAX_CANVAS_HEIGHT) / height
      height = MAX_CANVAS_HEIGHT
    }

    canvas.width = width
    canvas.height = height
    maskCanvas.width = width
    maskCanvas.height = height

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    baseImageRef.current = img

    maskCtx.clearRect(0, 0, width, height)
    maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
    maskCtx.fillRect(0, 0, width, height)

    const initialState = maskCtx.getImageData(0, 0, width, height)
    setHistory([initialState])
    setHistoryIndex(0)
  }, [])

  useEffect(() => {
    let isCancelled = false
    setIsDrawing(false)
    onMaskCreated(null)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (isCancelled) return
      initializeCanvas(img)
    }
    img.src = baseImage

    return () => {
      isCancelled = true
    }
  }, [baseImage, initializeCanvas, onMaskCreated])

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

  const updateMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    const dataUrl = maskCanvas.toDataURL()
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
      const width = maxX - minX + 1
      const height = maxY - minY + 1

      // 验证掩码尺寸非零
      if (width > 0 && height > 0) {
        onMaskCreated({
          dataUrl,
          coordinates: {
            x: minX,
            y: minY,
            width,
            height,
          },
        })
      } else {
        console.warn("[Canvas Editor] Invalid mask dimensions:", { width, height })
        onMaskCreated(null)
      }
    } else {
      onMaskCreated(null)
    }
  }, [onMaskCreated])

  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    setHistoryIndex(historyIndex - 1)
    maskCtx.putImageData(history[historyIndex - 1], 0, 0)
    redrawCanvas()
    updateMask()
  }, [historyIndex, history, redrawCanvas, updateMask])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    setHistoryIndex(historyIndex + 1)
    maskCtx.putImageData(history[historyIndex + 1], 0, 0)
    redrawCanvas()
    updateMask()
  }, [historyIndex, history, redrawCanvas, updateMask])

  // Keyboard shortcuts:
  //   B / 1       → brush tool
  //   E / 2       → eraser tool
  //   [           → decrease brush size by 5 (min 5)
  //   ]           → increase brush size by 5 (max 100)
  //   Ctrl+Z      → undo
  //   Ctrl+Y / Ctrl+Shift+Z → redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

      // Tool shortcuts (no modifier)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "b":
          case "1":
            e.preventDefault()
            setTool("brush")
            break
          case "e":
          case "2":
            e.preventDefault()
            setTool("eraser")
            break
          case "[":
            e.preventDefault()
            setBrushSize((s) => Math.max(5, s - 5))
            break
          case "]":
            e.preventDefault()
            setBrushSize((s) => Math.min(100, s + 5))
            break
        }
      }

      // Undo / redo with Ctrl / Cmd
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    saveToHistory(maskCanvas)
    redrawCanvas()
    updateMask()
  }, [saveToHistory, redrawCanvas, updateMask])

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        maskCtx.fillStyle = tool === "brush" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)"
        maskCtx.fill()
      }

      redrawCanvas()
    },
    [isDrawing, tool, brushSize, redrawCanvas]
  )

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

  return (
    <Card className="flex flex-col">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Select Region to Fix</h3>
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
