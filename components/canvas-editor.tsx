"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Pencil, Eraser, Square, Circle, Undo, Redo, Trash2 } from "lucide-react"
import type { MaskData } from "@/types"

// ============ 类型定义 ============
interface CanvasEditorProps {
  elementImage: string
  baseImage: string
  onMaskCreated: (mask: MaskData) => void
}

type Tool = "brush" | "eraser" | "rectangle" | "circle"

// ============ 常量 ============
const MAX_CANVAS_WIDTH = 800
const MAX_CANVAS_HEIGHT = 600
const MASK_OVERLAY_COLOR = { r: 59, g: 130, b: 246 } // Primary blue
const MASK_OVERLAY_ALPHA = 128

// ============ 主组件 ============
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

  // 重绘画布
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas || !baseImageRef.current) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    // 清除并重绘基础图片
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height)

    // 创建遮罩覆盖层
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = maskCanvas.width
    tempCanvas.height = maskCanvas.height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const overlayData = tempCtx.createImageData(maskCanvas.width, maskCanvas.height)

    for (let i = 0; i < maskImageData.data.length; i += 4) {
      if (maskImageData.data[i] === 255) {
        // 白色像素 = 选中区域
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

  // 初始化画布
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
      let { width, height } = img

      // 缩放以适应最大尺寸
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

      ctx.drawImage(img, 0, 0, width, height)
      baseImageRef.current = img

      // 初始化遮罩画布（黑色 = 未选中）
      maskCtx.fillStyle = "rgba(0, 0, 0, 1)"
      maskCtx.fillRect(0, 0, width, height)

      // 保存初始状态
      const initialState = maskCtx.getImageData(0, 0, width, height)
      setHistory([initialState])
      setHistoryIndex(0)

      isInitialized.current = true
    }
    img.src = baseImage
  }, [baseImage])

  // 保存到历史记录
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

  // 更新遮罩数据
  const updateMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    const dataUrl = maskCanvas.toDataURL()
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const data = imageData.data

    // 计算遮罩的边界框
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

  // 撤销
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

  // 重做
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

  // 清除遮罩
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

  // 绘制处理
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
      {/* 工具栏 */}
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

      {/* 画布区域 */}
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

      {/* 说明 */}
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
