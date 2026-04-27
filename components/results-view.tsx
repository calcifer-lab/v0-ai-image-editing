"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Edit, RotateCcw, ArrowLeftRight } from "lucide-react"

interface ResultsViewProps {
  originalImage: string
  resultImage: string
  onEdit: () => void
  onReset: () => void
}

type ViewMode = "side" | "slider"

export default function ResultsView({ originalImage, resultImage, onEdit, onReset }: ResultsViewProps) {
  const [view, setView] = useState<ViewMode>("side")
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

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
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 p-8">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)} className="w-full max-w-5xl">
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
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function ResultsHeader({
  onEdit,
  onReset,
  onDownload,
}: {
  onEdit: () => void
  onReset: () => void
  onDownload: () => void
}) {
  return (
    <div className="shrink-0 border-b p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fix Complete!</h2>
          <p className="text-muted-foreground">Compare your original and the fixed result</p>
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
}: {
  originalImage: string
  resultImage: string
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/50 p-4">
          <h3 className="font-semibold">Original</h3>
        </div>
        <div className="p-4">
          <div className="overflow-hidden rounded-lg border">
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="w-full rounded-lg"
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
          <div className="overflow-hidden rounded-lg border">
            <img
              src={resultImage || "/placeholder.svg"}
              alt="Result"
              className="w-full rounded-lg"
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
}: {
  originalImage: string
  resultImage: string
  sliderPosition: number
  onSliderChange: (value: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  containerWidth: number
}) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clampedX = Math.max(0, Math.min(x, containerWidth))
    const percent = (clampedX / containerWidth) * 100
    onSliderChange(percent)
  }

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
          style={{ width: "100%", height: "100%", maxHeight: "70vh" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {}}
        >
          {/* Both images are position absolute, same size - slider only clips, doesn't scale */}
          {/* Result image (bottom layer, always full width) */}
          <img
            src={resultImage || "/placeholder.svg"}
            alt="Result"
            className="pointer-events-none absolute inset-0 block h-full w-full object-contain"
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Original image (top layer, clipped by slider position) */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="absolute inset-0 h-full w-full object-contain"
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
            onChange={(e) => {
              onSliderChange(Number(e.target.value))
            }}
            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            style={{ touchAction: "pan-y" }}
            aria-label="Comparison slider"
          />
        </div>
      </div>
    </Card>
  )
}
