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
  const [feather, setFeather] = useState(0) // 0 = hard edge, 20 = max softness
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  // Shape drawing state
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
  const [shapePreview, setShapePreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [shapeFill, setShapeFill] = useState(true) // true = filled, false = stroke/outline
  // Ref for synchronous draw-state check (avoids React setState lag)
  const isDrawingRef = useRef(false)
  // Cursor preview state (display coordinates)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [cursorOnCanvas, setCursorOnCanvas] = useState(false)

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
        if (data[i] > 0) {
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
  //   B / 1           → brush tool
  //   E / 2           → eraser tool
  //   [               → decrease brush size by 5 (min 5)
  //   ]               → increase brush size by 5 (max 100)
  //   Shift+[         → decrease feather by 2 (min 0)
  //   Shift+]         → increase feather by 2 (max 20)
  //   F               → toggle fill/stroke mode
  //   Alt+F           → toggle feather between 0 and 8
  //   Ctrl+Z          → undo
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
          case "r":
          case "3":
            e.preventDefault()
            setTool("rectangle")
            break
          case "c":
          case "4":
            e.preventDefault()
            setTool("circle")
            break
          case "[":
            e.preventDefault()
            if (e.shiftKey) {
              setFeather((f) => Math.max(0, f - 2))
            } else {
              setBrushSize((s) => Math.max(5, s - 5))
            }
            break
          case "]":
            e.preventDefault()
            if (e.shiftKey) {
              setFeather((f) => Math.min(20, f + 2))
            } else {
              setBrushSize((s) => Math.min(100, s + 5))
            }
            break
          case "f":
            e.preventDefault()
            if (e.altKey) {
              setFeather((f) => (f > 0 ? 0 : 8))
            } else {
              setShapeFill((v) => !v)
            }
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

  /**
   * Get canvas-relative coordinates from a mouse event.
   */
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    []
  )

  /**
   * Draw a filled rectangle on the mask context with optional feather (soft edge).
   */
  const drawRectOnMask = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      fillColor: string,
      featherPx: number
    ) => {
      if (featherPx > 0) {
        // Soft-edge rectangle: draw multiple nested rects with decreasing alpha
        const steps = featherPx
        for (let i = steps; i >= 0; i--) {
          const alpha = i === 0 ? 1 : i / steps
          ctx.globalAlpha = alpha
          ctx.fillStyle = fillColor
          ctx.fillRect(x - i, y - i, w + i * 2, h + i * 2)
        }
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = fillColor
        ctx.fillRect(x, y, w, h)
      }
    },
    []
  )

  /**
   * Draw a stroked rectangle on the mask context with optional feather (soft edge).
   */
  const drawRectStrokeOnMask = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      strokeColor: string,
      featherPx: number
    ) => {
      if (featherPx > 0) {
        // Soft-edge stroke: draw multiple concentric rectangles with decreasing alpha
        const steps = featherPx
        for (let i = steps; i >= 0; i--) {
          const alpha = i === 0 ? 1 : i / steps
          ctx.globalAlpha = alpha
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = i * 2 // line width expands outward
          ctx.strokeRect(x - i, y - i, w + i * 2, h + i * 2)
        }
        ctx.globalAlpha = 1
      } else {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
      }
    },
    []
  )

  /**
   * Draw a stroked circle (ellipse) on the mask context with optional feather (soft edge).
   */
  const drawCircleStrokeOnMask = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      strokeColor: string,
      featherPx: number
    ) => {
      if (featherPx > 0) {
        // Soft-edge stroke: multiple concentric ellipses with decreasing alpha
        const steps = featherPx
        for (let i = steps; i >= 0; i--) {
          const alpha = i === 0 ? 1 : i / steps
          ctx.globalAlpha = alpha
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = i * 2
          ctx.beginPath()
          ctx.ellipse(cx, cy, rx + i, ry + i, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      } else {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    []
  )

  /**
   * Draw a filled circle (ellipse) on the mask context with optional feather.
   */
  const drawCircleOnMask = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      fillColor: string,
      featherPx: number
    ) => {
      if (featherPx > 0) {
        // Soft-edge circle using radial gradient
        const innerRx = Math.max(0, rx - featherPx)
        const innerRy = Math.max(0, ry - featherPx)
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
        const [r, g, b] = fillColor.match(/\d+/g)!.map(Number)
        gradient.addColorStop(0, `rgba(${r},${g},${b},1)`)
        gradient.addColorStop(innerRx / rx, `rgba(${r},${g},${b},1)`)
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.fillStyle = fillColor
        ctx.fill()
      }
    },
    []
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Use ref for synchronous check; state is only for re-renders
      if (!isDrawingRef.current && e.type !== "mousedown") return

      const maskCanvas = maskCanvasRef.current
      if (!maskCanvas) return

      const maskCtx = maskCanvas.getContext("2d")
      if (!maskCtx) return

      const { x: cx, y: cy } = getCanvasPoint(e)

      if (tool === "brush" || tool === "eraser") {
        const radius = brushSize / 2
        if (feather > 0) {
          const innerRadius = Math.max(0, radius - feather)
          const gradient = maskCtx.createRadialGradient(cx, cy, innerRadius, cx, cy, radius)
          if (tool === "brush") {
            gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
          } else {
            gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
            gradient.addColorStop(1, "rgba(0, 0, 0, 1)")
          }
          maskCtx.beginPath()
          maskCtx.arc(cx, cy, radius, 0, Math.PI * 2)
          maskCtx.fillStyle = gradient
          maskCtx.fill()
        } else {
          maskCtx.beginPath()
          maskCtx.arc(cx, cy, radius, 0, Math.PI * 2)
          maskCtx.fillStyle = tool === "brush" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)"
          maskCtx.fill()
        }
      } else if ((tool === "rectangle" || tool === "circle") && shapeStartRef.current) {
        // Shape tools: restore mask from history to get clean slate, then draw live preview
        const start = shapeStartRef.current
        const x0 = Math.min(start.x, cx)
        const y0 = Math.min(start.y, cy)
        const w = Math.abs(cx - start.x)
        const h = Math.abs(cy - start.y)

        // Restore mask from last history state for clean redraw
        const historyState = history[historyIndex]
        if (historyState) {
          maskCtx.putImageData(historyState, 0, 0)
        }

        if (tool === "rectangle") {
          if (shapeFill) {
            drawRectOnMask(maskCtx, x0, y0, w, h, "rgba(255, 255, 255, 1)", feather)
          } else {
            drawRectStrokeOnMask(maskCtx, x0, y0, w, h, "rgba(255, 255, 255, 1)", feather)
          }
        } else {
          // Circle: center at midpoint, radii = half width/height
          const rx = w / 2
          const ry = h / 2
          if (shapeFill) {
            drawCircleOnMask(maskCtx, start.x + (cx - start.x) / 2, start.y + (cy - start.y) / 2, rx, ry, "rgba(255, 255, 255, 1)", feather)
          } else {
            drawCircleStrokeOnMask(maskCtx, start.x + (cx - start.x) / 2, start.y + (cy - start.y) / 2, rx, ry, "rgba(255, 255, 255, 1)", feather)
          }
        }

        // Update live preview state for potential future cursor indicator
        setShapePreview({ x: x0, y: y0, w, h })
      }

      redrawCanvas()
    },
    [tool, brushSize, feather, redrawCanvas, getCanvasPoint, drawRectOnMask, drawRectStrokeOnMask, drawCircleOnMask, drawCircleStrokeOnMask, shapeFill, history, historyIndex]
  )

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true
    setIsDrawing(true)
    const { x, y } = getCanvasPoint(e)
    // Record shape start for rectangle/circle tools
    if (tool === "rectangle" || tool === "circle") {
      shapeStartRef.current = { x, y }
    }
    draw(e)
  }

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      const maskCanvas = maskCanvasRef.current
      if (maskCanvas) {
        saveToHistory(maskCanvas)
        updateMask()
      }
    }
    setIsDrawing(false)
    shapeStartRef.current = null
    setShapePreview(null)
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
            <TabsTrigger value="rectangle" className="gap-2">
              <Square className="h-4 w-4" />
              Rectangle
            </TabsTrigger>
            <TabsTrigger value="circle" className="gap-2">
              <Circle className="h-4 w-4" />
              Circle
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Fill / Stroke toggle — only shown for shape tools */}
        {(tool === "rectangle" || tool === "circle") && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Mode:</span>
            <Button
              variant={shapeFill ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setShapeFill(true)}
            >
              Fill
            </Button>
            <Button
              variant={!shapeFill ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setShapeFill(false)}
            >
              Stroke
            </Button>
          </div>
        )}

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Brush Size</span>
            <span className="font-medium">{brushSize}px</span>
          </div>
          <Slider value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} min={5} max={100} step={5} />

          <div className="mb-2 mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Feather</span>
            <span className="font-medium">{feather}px</span>
          </div>
          <Slider value={[feather]} onValueChange={(v) => setFeather(v[0])} min={0} max={20} step={1} />
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
              draw(e)
              // Track cursor position for brush preview
              const canvas = canvasRef.current
              if (canvas) {
                const rect = canvas.getBoundingClientRect()
                setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              }
            }}
            onMouseUp={stopDrawing}
            onMouseLeave={() => { stopDrawing(); setCursorOnCanvas(false); setCursorPos(null) }}
            onMouseEnter={(e) => { setCursorOnCanvas(true); const canvas = canvasRef.current; if (canvas) { const rect = canvas.getBoundingClientRect(); setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top }) } }}
            className="cursor-crosshair rounded-lg border shadow-lg"
            style={{ maxWidth: "100%", maxHeight: "min(400px, 50vh)", height: "auto" }}
          />
          <canvas ref={maskCanvasRef} className="hidden" />

          {/* Brush cursor overlay — only shown when hovering with brush/eraser tool */}
          {cursorOnCanvas && cursorPos && (tool === "brush" || tool === "eraser") && (
            <svg
              className="pointer-events-none absolute overflow-visible"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                transform: "translate(-50%, -50%)",
                overflow: "visible",
              }}
              width="0"
              height="0"
            >
              {/* Feather outer ring — shows soft edge boundary */}
              {feather > 0 && (
                <circle
                  cx="0"
                  cy="0"
                  r={brushSize / 2 + feather}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                />
              )}
              {/* Main brush circle outline */}
              <circle
                cx="0"
                cy="0"
                r={brushSize / 2}
                fill={tool === "eraser" ? "rgba(255,0,0,0.1)" : "rgba(59,130,246,0.1)"}
                stroke={tool === "eraser" ? "rgba(255,100,100,0.8)" : "rgba(59,130,246,0.8)"}
                strokeWidth="1.5"
              />
              {/* Center crosshair dot */}
              <circle cx="0" cy="0" r="1.5" fill={tool === "eraser" ? "rgba(255,100,100,0.9)" : "rgba(59,130,246,0.9)"} />
            </svg>
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary" />
          <span className="text-sm text-muted-foreground">
            Brush/Eraser: click &amp; drag · Rectangle/Circle: click &amp; drag to draw shape
          </span>
        </div>
      </div>
    </Card>
  )
}
