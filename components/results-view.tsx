"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Edit, RotateCcw, ArrowLeftRight, AlertTriangle } from "lucide-react"

interface ResultsViewProps {
  originalImage: string
  resultImage: string
  onEdit: () => void
  onReset: () => void
  warning?: string | null
}

type ViewMode = "side" | "slider"

export default function ResultsView({ originalImage, resultImage, onEdit, onReset, warning }: ResultsViewProps) {
  const [view, setView] = useState<ViewMode>("side")
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderContainerRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = resultImage
    link.download = "fix-result.png"
    link.click()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ResultsHeader
        onEdit={onEdit}
        onReset={onReset}
        onDownload={handleDownload}
        warning={warning}
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
                warning={warning}
              />
            </TabsContent>

            <TabsContent value="slider" className="mt-6">
              <SliderCompareView
                originalImage={originalImage}
                resultImage={resultImage}
                sliderPosition={sliderPosition}
                onSliderChange={setSliderPosition}
                containerRef={sliderContainerRef}
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
  warning,
}: {
  onEdit: () => void
  onReset: () => void
  onDownload: () => void
  warning?: string | null
}) {
  return (
    <div className="shrink-0 border-b p-6">
      <div className="flex items-center justify-between">
        <div>
          {warning ? (
            <>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-amber-600">
                <AlertTriangle className="h-6 w-6" />
                Direct Composite Result
              </h2>
              <p className="text-amber-600/80">{warning}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Fix Complete!</h2>
              <p className="text-muted-foreground">Compare your original and the fixed result</p>
            </>
          )}
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
  warning,
}: {
  originalImage: string
  resultImage: string
  warning?: string | null
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
        <div className={`border-b p-4 ${warning ? "bg-amber-50" : "bg-primary/10"}`}>
          <h3 className={`flex items-center gap-1.5 font-semibold ${warning ? "text-amber-700" : "text-primary"}`}>
            {warning && <AlertTriangle className="h-4 w-4" />}
            {warning ? "Direct Composite (AI unavailable)" : "Fixed"}
          </h3>
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
}: {
  originalImage: string
  resultImage: string
  sliderPosition: number
  onSliderChange: (value: number) => void
  containerRef: ReturnType<typeof useRef<HTMLDivElement | null>>
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalHeight / img.naturalWidth)
      }
    }
    img.src = resultImage
  }, [resultImage])

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold">Comparison Slider</h3>
        <p className="text-sm text-muted-foreground">Drag the slider to compare images</p>
      </div>
      <div className="p-4">
        {/* paddingBottom maintains the image's exact aspect ratio — no blank areas for slider to escape into */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border"
          style={{
            width: "100%",
            paddingBottom: aspectRatio != null ? `${aspectRatio * 100}%` : "56.25%",
          }}
        >
          <img
            src={resultImage || "/placeholder.svg"}
            alt="Result"
            className="pointer-events-none absolute inset-0 w-full h-full object-fill"
            crossOrigin="anonymous"
            draggable={false}
          />
          <img
            src={originalImage || "/placeholder.svg"}
            alt="Original"
            className="pointer-events-none absolute inset-0 w-full h-full object-fill"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            crossOrigin="anonymous"
            draggable={false}
          />

          <div
            className="absolute inset-y-0 z-10 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-xl">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </div>
          </div>

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
