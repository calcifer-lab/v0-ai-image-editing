"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Edit, RotateCcw, ArrowLeftRight } from "lucide-react"

// ============ 类型定义 ============
interface ResultsViewProps {
  originalImage: string
  resultImage: string
  onEdit: () => void
  onReset: () => void
}

type ViewMode = "side" | "slider"

// ============ 主组件 ============
export default function ResultsView({ originalImage, resultImage, onEdit, onReset }: ResultsViewProps) {
  const [view, setView] = useState<ViewMode>("side")
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // 更新容器宽度
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

  // 下载结果图片
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = resultImage
    link.download = "ai-edited-image.png"
    link.click()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 头部 */}
      <ResultsHeader onEdit={onEdit} onReset={onReset} onDownload={handleDownload} />

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 p-8">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as ViewMode)}
            className="w-full max-w-5xl"
          >
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
              <SideBySideView originalImage={originalImage} resultImage={resultImage} />
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

// ============ 子组件 ============

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
          <h2 className="text-2xl font-bold">Result Ready!</h2>
          <p className="text-muted-foreground">Compare your original and AI-edited images</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Again
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
          <img
            src={originalImage || "/placeholder.svg"}
            alt="Original"
            className="w-full rounded-lg border"
            crossOrigin="anonymous"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b bg-primary/10 p-4">
          <h3 className="font-semibold text-primary">AI Edited</h3>
        </div>
        <div className="p-4">
          <img
            src={resultImage || "/placeholder.svg"}
            alt="Result"
            className="w-full rounded-lg border"
            crossOrigin="anonymous"
          />
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
  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold">Comparison Slider</h3>
        <p className="text-sm text-muted-foreground">Drag the slider to compare images</p>
      </div>
      <div className="p-4">
        <div ref={containerRef} className="relative overflow-hidden rounded-lg border">
          {/* 结果图片（背景） */}
          <img
            src={resultImage || "/placeholder.svg"}
            alt="Result"
            className="block w-full"
            crossOrigin="anonymous"
          />

          {/* 原始图片（前景，裁剪） */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage || "/placeholder.svg"}
              alt="Original"
              className="block h-full object-cover"
              crossOrigin="anonymous"
              style={{
                width: containerWidth > 0 ? `${containerWidth}px` : "100%",
                maxWidth: "none",
              }}
            />
          </div>

          {/* 滑块手柄 */}
          <div
            className="absolute inset-y-0 z-10 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-xl">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* 不可见滑块输入 */}
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
