"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Pencil, Eraser, Square, Circle, Undo, Redo, Trash2 } from "lucide-react"
// Added Help overlay UI components

import type { MaskData } from "@/types"

export interface CanvasEditorRef {
  maskCanvas: HTMLCanvasElement | null
}

interface CanvasEditorProps {
  elementImage: string
  baseImage: string
  onMaskCreated: (mask: MaskData | null) => void
}

type Tool = "brush" | "eraser" | "rectangle" | "circle"

const MAX_CANVAS_WIDTH = 800
const MAX_CANVAS_HEIGHT = 999
const MASK_OVERLAY_COLOR = { r: 59, g: 130, b: 246 } // Primary blue
const MASK_OVERLAY_ALPHA = 128
const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

export default forwardRef(function CanvasEditor({ elementImage, baseImage, onMaskCreated }: CanvasEditorProps, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => ({
    maskCanvas: maskCanvasRef.current,
  }))
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>("brush")
  const [brushSize, setBrushSize] = useState(80)
  const [feather, setFeather] = useState(0) // 0 = hard edge, 20 = max softness
  const [sizeToast, setSizeToast] = useState<string | null>(null)
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
  // Shape tool live preview — tracks cursor position for SVG overlay
  const [shapeCursorPos, setShapeCursorPos] = useState<{ x: number; y: number } | null>(null)
  // Zoom and pan state for canvas navigation
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePanning, setIsSpacePanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  // Canvas dimensions state for container sizing
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

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

    let width = img.naturalWidth
    let height = img.naturalHeight

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

    // Update canvasSize state for container sizing
    setCanvasSize({ width, height })

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

  // Track spacebar for panning mode (space+drag = pan like in Figma/Photoshop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setIsSpacePanning(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePanning(false)
        setIsPanning(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Auto-hide brush/feather size toast after 800ms
  useEffect(() => {
    if (!sizeToast) return
    const timer = setTimeout(() => setSizeToast(null), 800)
    return () => clearTimeout(timer)
  }, [sizeToast])

  // Pan with middle mouse or space+drag
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Middle mouse button OR space+left click = start panning
      if (e.button === 1 || (e.button === 0 && isSpacePanning)) {
        e.preventDefault()
        setIsPanning(true)
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      }
    },
    [pan, isSpacePanning]
  )
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning) return
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy })
    },
    [isPanning]
  )
  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

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
  //   Tab               → cycle tools (brush → eraser → rect → circle → brush)
  //   B / 1           → brush tool
  //   E / 2           → eraser tool
  //   R               → rectangle tool
  //   C               → circle tool
  //   [               → decrease brush size by 5 (min 5)
  //   ]               → increase brush size by 5 (max 100)
  //   Shift+[         → decrease feather by 2 (min 0)
  //   Shift+]         → increase feather by 2 (max 20)
  //   F               → toggle fill/stroke mode (shape tools)
  //   Alt+F           → toggle feather between 0 and 8
  //   Escape          → cancel in-progress shape drawing
  //   Ctrl+Z          → undo
  //   Ctrl+Y / Ctrl+Shift+Z → redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

      // Tool shortcuts (no modifier)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key) {
          case "Tab":
            e.preventDefault()
            setTool((current) => {
              const tools: Tool[] = ["brush", "eraser", "rectangle", "circle"]
              const idx = tools.indexOf(current)
              return tools[(idx + 1) % tools.length]
            })
            break
          case "b":
          case "B":
          case "1":
            e.preventDefault()
            setTool("brush")
            break
          case "e":
          case "E":
          case "2":
            e.preventDefault()
            setTool("eraser")
            break
          case "r":
          case "R":
          case "3":
            e.preventDefault()
            setTool("rectangle")
            break
          case "c":
          case "C":
          case "4":
            e.preventDefault()
            setTool("circle")
            break
          case "[":
          case "{":
            e.preventDefault()
            if (e.shiftKey) {
              setFeather((f) => {
                const next = Math.max(0, f - 2)
                setSizeToast(`Feather: ${next}`)
                return next
              })
            } else {
              setBrushSize((s) => {
                const next = Math.max(5, s - 5)
                setSizeToast(`Brush: ${next}px`)
                return next
              })
            }
            break
          case "]":
          case "}":
            e.preventDefault()
            if (e.shiftKey) {
              setFeather((f) => {
                const next = Math.min(20, f + 2)
                setSizeToast(`Feather: ${next}`)
                return next
              })
            } else {
              setBrushSize((s) => {
                const next = Math.min(100, s + 5)
                setSizeToast(`Brush: ${next}px`)
                return next
              })
            }
            break
          case "f":
            e.preventDefault()
            if (e.altKey) {
              setFeather((f) => {
                const next = f > 0 ? 0 : 8
                setSizeToast(`Feather: ${next}`)
                return next
              })
            } else {
              setShapeFill((v) => !v)
            }
            break
          case "Escape":
            if (isDrawingRef.current && shapeStartRef.current) {
              e.preventDefault()
              isDrawingRef.current = false
              setIsDrawing(false)
              shapeStartRef.current = null
              setShapePreview(null)
              // Restore previous mask state from history
              if (historyIndex >= 0 && history[historyIndex]) {
                const maskCtx = maskCanvasRef.current?.getContext("2d")
                if (maskCtx) {
                  maskCtx.putImageData(history[historyIndex], 0, 0)
                  redrawCanvas()
                  updateMask()
                }
              }
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
  }, [undo, redo, history, historyIndex, redrawCanvas, updateMask])

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
  // Convert mouse event to canvas coordinates, taking current zoom and pan into account
const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      // Adjust for pan offset (which is applied via CSS transform on container)
      const adjustedX = e.clientX - rect.left - pan.x
      const adjustedY = e.clientY - rect.top - pan.y
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: adjustedX * scaleX / zoom,
        y: adjustedY * scaleY / zoom,
      }
    },
    [zoom, pan]
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
      <div className="border-b p-3">
        <div className="mb-3 flex items-center justify-between">
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
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Brush</span>
        <Slider value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} min={5} max={100} step={5} />
        <span className="text-xs font-medium w-8">{brushSize}</span>
      </div>

      <div className="flex items-center justify-center p-4">
        <div
          id="canvas-editor-container"
          className="relative rounded-lg border shadow-lg overflow-auto"
          style={{
            maxWidth: "100%",
            maxHeight: "60vh",
            cursor: isPanning ? "grabbing" : isSpacePanning ? "grab" : undefined,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
              draw(e)
              // Track cursor position for brush preview
              const canvas = canvasRef.current
              if (canvas) {
                const rect = canvas.getBoundingClientRect()
                const screenX = e.clientX - rect.left
                const screenY = e.clientY - rect.top
                const scaleX = canvas.width / rect.width
                const scaleY = canvas.height / rect.height
                setCursorPos({ x: (screenX * scaleX) / zoom, y: (screenY * scaleY) / zoom })
                // Track shape cursor for SVG overlay preview
                if (tool === "rectangle" || tool === "circle") {
                  setShapeCursorPos({
                    x: screenX * scaleX,
                    y: screenY * scaleY,
                  })
                } else {
                  setShapeCursorPos(null)
                }
              }
            }}
            onMouseUp={stopDrawing}
            onMouseLeave={() => { stopDrawing(); setCursorOnCanvas(false); setCursorPos(null); setShapeCursorPos(null) }}
            onMouseEnter={(e) => {
              setCursorOnCanvas(true)
              const canvas = canvasRef.current
              if (canvas) {
                const rect = canvas.getBoundingClientRect()
                const screenX = e.clientX - rect.left
                const screenY = e.clientY - rect.top
                const scaleX = canvas.width / rect.width
                const scaleY = canvas.height / rect.height
                setCursorPos({ x: (screenX * scaleX) / zoom, y: (screenY * scaleY) / zoom })
                if (tool === "rectangle" || tool === "circle") {
                  setShapeCursorPos({ x: screenX * scaleX, y: screenY * scaleY })
                }
              }
            }}
            className="cursor-crosshair"
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

          {/* Shape tool live preview overlay — shows rectangle/circle outline while hovering or dragging */}
          {cursorOnCanvas && shapeCursorPos && (tool === "rectangle" || tool === "circle") && (
            (() => {
              const canvas = canvasRef.current
              if (!canvas) return null
              const rect = canvas.getBoundingClientRect()
              // Convert canvas coords back to screen coords for SVG overlay
              const screenX = shapeCursorPos.x * (rect.width / canvas.width)
              const screenY = shapeCursorPos.y * (rect.height / canvas.height)
              const start = shapeStartRef.current
              const isDragging = isDrawingRef.current && !!start
              let shapeEl = null
              if (isDragging) {
                // Show live rectangle/ellipse preview during drag
                const x0 = Math.min(start.x, shapeCursorPos.x)
                const y0 = Math.min(start.y, shapeCursorPos.y)
                const w = Math.abs(shapeCursorPos.x - start.x)
                const h = Math.abs(shapeCursorPos.y - start.y)
                // Convert shape bounds from canvas coords to screen coords
                const sx0 = x0 * (rect.width / canvas.width)
                const sy0 = y0 * (rect.height / canvas.height)
                const sw = w * (rect.width / canvas.width)
                const sh = h * (rect.height / canvas.height)
                if (tool === "rectangle") {
                  shapeEl = (
                    <rect
                      x={sx0}
                      y={sy0}
                      width={sw}
                      height={sh}
                      fill={shapeFill ? "rgba(59,130,246,0.15)" : "none"}
                      stroke="rgba(59,130,246,0.9)"
                      strokeWidth="1.5"
                      strokeDasharray={shapeFill ? "4 3" : "none"}
                    />
                  )
                } else {
                  const crx = sw / 2
                  const cry = sh / 2
                  const ccx = sx0 + crx
                  const ccy = sy0 + cry
                  shapeEl = (
                    <ellipse
                      cx={ccx}
                      cy={ccy}
                      rx={crx}
                      ry={cry}
                      fill={shapeFill ? "rgba(59,130,246,0.15)" : "none"}
                      stroke="rgba(59,130,246,0.9)"
                      strokeWidth="1.5"
                      strokeDasharray={shapeFill ? "4 3" : "none"}
                    />
                  )
                }
              } else {
                // Hovering without dragging — show small crosshair at cursor
                shapeEl = (
                  <g>
                    <line x1={screenX - 8} y1={screenY} x2={screenX + 8} y2={screenY} stroke="rgba(59,130,246,0.7)" strokeWidth="1" />
                    <line x1={screenX} y1={screenY - 8} x2={screenX} y2={screenY + 8} stroke="rgba(59,130,246,0.7)" strokeWidth="1" />
                  </g>
                )
              }
              return (
                <svg
                  className="pointer-events-none absolute"
                  style={{ left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }}
                >
                  {shapeEl}
                </svg>
              )
            })()
          )}
          {/* Brush/Feather size toast — shown briefly when adjusting via keyboard */}
          {sizeToast && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/80 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
              {sizeToast}
            </div>
          )}
        </div>
      </div>

    </Card>
  )
})
