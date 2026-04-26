"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Download, Edit, RotateCcw, ArrowLeftRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface ResultsViewProps {
  originalImage: string
  resultImage: string
  onEdit: () => void
  onReset: () => void
}

type ViewMode = "side" | "slider"

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

export default function ResultsView({ originalImage, resultImage, onEdit, onReset }: ResultsViewProps) {
  const [view, setView] = useState<ViewMode>("side")
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Zoom and pan state shared across both views
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  useEffect(() => {
    const updateWidth = () => {
      if (sliderContainerRef.current) {
        setContainerWidth(sliderContainerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  // Reset zoom/pan when switching images
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Zoom with Ctrl+Wheel
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
        setZoom((z) => Math.max(MIN_ZOOM, Math.min(z + delta, MAX_ZOOM)))
      } else {
        // Pan with regular scroll
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Only on left click
        setIsPanning(true)
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      }
    },
    [pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy })
    },
    [isPanning]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Reset zoom/pan when switching views
  const handleViewChange = (v: ViewMode) => {
    setView(v)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const zoomStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    transformOrigin: "center center",
    transition: isPanning ? "none" : "transform 0.15s ease-out",
    cursor: isPanning ? "grabbing" : zoom > 1 ? "grab" : "default",
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = resultImage
    link.download = "rediagram-fix.png"
    link.click()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ResultsHeader
        onEdit={onEdit}
        onReset={onReset}
        onDownload={handleDownload}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 p-8">
          <Tabs value={view} onValueChange={(v) => handleViewChange(v as ViewMode)} className="w-full max-w-5xl">
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="side" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Side by Side
              </TabsTrigger>
              <TabsTrigger value="slider" className="gap-2">
                <ArrowLeftRight className="h-4 w-4 rotate-90" />
                Slider
              </TabsTrigger>
            </TabsList>

            <TabsContent value="side" className="mt-6">
              <SideBySideView
                originalImage={originalImage}
                resultImage={resultImage}
                zoomStyle={zoomStyle}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </TabsContent>

            <TabsContent value="slider" className="mt-6">
              <SliderCompareView
                originalImage={originalImage}
                resultImage={resultImage}
                sliderPosition={sliderPosition}
                onSliderChange={setSliderPosition}
                containerRef={sliderContainerRef}
                containerWidth={containerWidth}
                zoomStyle={zoomStyle}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </TabsContent>
          </Tabs>

          {zoom > 1 && (
            <p className="text-xs text-muted-foreground">
              Scroll to pan · Ctrl+Scroll to zoom · Double-click to reset
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultsHeader({
  onEdit,
  onReset,
  onDownload,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  onEdit: () => void
  onReset: () => void
  onDownload: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}) {
  return (
    <div className="shrink-0 border-b p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fix Complete!</h2>
          <p className="text-muted-foreground">Compare your original and the fixed result</p>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom Out"
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <button
            onClick={onZoomReset}
            className="min-w-[3.5rem] text-sm font-medium tabular-nums hover:text-primary focus:outline-none"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom In"
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomReset}
            title="Fit to View"
            className="h-7 w-7 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Fix Again
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start New
          </Button>
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}

function SideBySideView({
  originalImage,
  resultImage,
  zoomStyle,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: {
  originalImage: string
  resultImage: string
  zoomStyle: React.CSSProperties
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/50 p-4">
          <h3 className="font-semibold">Original</h3>
        </div>
        <div className="p-4">
          <div
            className="overflow-hidden rounded-lg border"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="w-full rounded-lg"
              style={zoomStyle}
              crossOrigin="anonymous"
              draggable={false}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b bg-primary/10 p-4">
          <h3 className="font-semibold text-primary">Fixed</h3>
        </div>
        <div className="p-4">
          <div
            className="overflow-hidden rounded-lg border"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            <img
              src={resultImage || "/placeholder.svg"}
              alt="Result"
              className="w-full rounded-lg"
              style={zoomStyle}
              crossOrigin="anonymous"
              draggable={false}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

function SliderCompareView({
  originalImage,
  resultImage,
  sliderPosition,
  onSliderChange,
  containerRef,
  containerWidth,
  zoomStyle,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: {
  originalImage: string
  resultImage: string
  sliderPosition: number
  onSliderChange: (value: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  containerWidth: number
  zoomStyle: React.CSSProperties
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
}) {
  // When zoomed, the slider position needs to be in absolute pixel terms
  // We keep sliderPosition as percentage but scale it by zoom for the visual divider
  const effectiveContainerWidth = containerWidth

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold">Comparison Slider</h3>
        <p className="text-sm text-muted-foreground">Drag the slider to compare images</p>
      </div>
      <div className="p-4">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Result image (bottom layer) */}
          <img
            src={resultImage || "/placeholder.svg"}
            alt="Result"
            className="block w-full"
            style={zoomStyle}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Original image (top layer, clipped by slider) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="block h-full object-cover"
              style={{
                ...zoomStyle,
                // Keep the image aligned with the zoomed result
                width: effectiveContainerWidth > 0 ? effectiveContainerWidth : "100%",
                maxWidth: "none",
              }}
              crossOrigin="anonymous"
              draggable={false}
            />
          </div>

          {/* Slider divider line */}
          <div
            className="absolute inset-y-0 z-10 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-xl">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Invisible range input for slider interaction */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            style={{ touchAction: "pan-y" }}
            aria-label="Comparison slider"
          />
        </div>
      </div>
    </Card>
  )
}
