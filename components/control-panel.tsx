"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Maximize2, Layers, Wand2 } from "lucide-react"
import type { EditParams, AspectRatio, ScaleMode } from "@/types"
import { ASPECT_RATIOS } from "@/lib/image-utils"

interface ControlPanelProps {
  params: EditParams
  onParamsChange: (params: EditParams) => void
  onProcess: () => void
  isProcessing: boolean
  canProcess: boolean
  processingStatus?: string
  error?: string | null
  imageAnalysis?: string | null
  isAnalyzing?: boolean
}

export default function ControlPanel({
  params,
  onParamsChange,
  onProcess,
  isProcessing,
  canProcess,
  processingStatus = "",
  error = null,
  imageAnalysis = null,
  isAnalyzing = false,
}: ControlPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Edit Parameters</h3>
        <p className="text-sm text-muted-foreground">Configure how AI will blend the elements</p>
      </div>

      <EditModeSection params={params} onParamsChange={onParamsChange} />
      <OutputDimensionsSection params={params} onParamsChange={onParamsChange} />

      <div className="flex-1 space-y-6 overflow-auto p-4">
        <AnalysisStatus isAnalyzing={isAnalyzing} imageAnalysis={imageAnalysis} />
        {error && <ErrorDisplay error={error} />}

        <PromptInput
          value={params.prompt}
          onChange={(prompt) => onParamsChange({ ...params, prompt })}
          hasAnalysis={!!imageAnalysis}
        />

        <SliderControl
          label="Generation Strength"
          value={params.strength}
          onChange={(strength) => onParamsChange({ ...params, strength })}
          min={0.1}
          max={1.0}
          step={0.1}
          description="Higher values generate more creative content"
        />

        <SliderControl
          label="Guidance Scale"
          value={params.guidance}
          onChange={(guidance) => onParamsChange({ ...params, guidance })}
          min={1}
          max={20}
          step={0.5}
          description="How closely to follow the reference image"
        />

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="preserve-structure">Preserve Structure</Label>
            <p className="text-xs text-muted-foreground">Maintain the original composition</p>
          </div>
          <Switch
            id="preserve-structure"
            checked={params.preserveStructure}
            onCheckedChange={(checked) => onParamsChange({ ...params, preserveStructure: checked })}
          />
        </div>
      </div>

      <ProcessButton
        onProcess={onProcess}
        isProcessing={isProcessing}
        canProcess={canProcess}
        processingStatus={processingStatus}
      />
    </Card>
  )
}

function EditModeSection({
  params,
  onParamsChange,
}: {
  params: EditParams
  onParamsChange: (params: EditParams) => void
}) {
  return (
    <div className="shrink-0 border-b p-4">
      <div className="space-y-3 rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-orange-600" />
          <Label className="text-base font-semibold text-orange-900 dark:text-orange-100">
            Edit Mode
          </Label>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={params.editMode === "composite"}
            onClick={() => onParamsChange({ ...params, editMode: "composite" })}
            icon={Layers}
            label="Direct Paste"
            description="Exact copy"
          />
          <ModeButton
            active={params.editMode === "ai"}
            onClick={() => onParamsChange({ ...params, editMode: "ai" })}
            icon={Wand2}
            label="AI Generate"
            description="Style adapt"
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          {params.editMode === "composite"
            ? "Recommended for precise element transfer. Select the element area on the right."
            : "AI interprets and adapts the style. Results may vary from the original."}
        </p>
      </div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
        active
          ? "border-orange-500 bg-orange-100 dark:bg-orange-900"
          : "border-gray-200 hover:border-orange-300 dark:border-gray-700"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">{description}</span>
    </button>
  )
}

function OutputDimensionsSection({
  params,
  onParamsChange,
}: {
  params: EditParams
  onParamsChange: (params: EditParams) => void
}) {
  return (
    <div className="shrink-0 border-b p-4">
      <div className="space-y-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Output Dimensions</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
          <Select
            value={params.outputDimensions.aspectRatio}
            onValueChange={(value: AspectRatio) =>
              onParamsChange({
                ...params,
                outputDimensions: { ...params.outputDimensions, aspectRatio: value },
              })
            }
          >
            <SelectTrigger id="aspect-ratio" className="h-11 text-base font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ASPECT_RATIOS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">{config.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {params.outputDimensions.aspectRatio === "custom" && (
          <div className="space-y-2">
            <Label>Custom Dimensions</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Width"
                  value={params.outputDimensions.customWidth || ""}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      outputDimensions: {
                        ...params.outputDimensions,
                        customWidth: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  min={100}
                  max={4096}
                />
              </div>
              <span className="flex items-center text-muted-foreground">×</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Height"
                  value={params.outputDimensions.customHeight || ""}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      outputDimensions: {
                        ...params.outputDimensions,
                        customHeight: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  min={100}
                  max={4096}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Min: 100px, Max: 4096px</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="scale-mode">Scale Mode</Label>
          <Select
            value={params.outputDimensions.scaleMode}
            onValueChange={(value: ScaleMode) =>
              onParamsChange({
                ...params,
                outputDimensions: { ...params.outputDimensions, scaleMode: value },
              })
            }
          >
            <SelectTrigger id="scale-mode" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Fit</span>
                  <span className="text-xs text-muted-foreground">Maintain aspect, add borders</span>
                </div>
              </SelectItem>
              <SelectItem value="fill">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Fill</span>
                  <span className="text-xs text-muted-foreground">Crop to fill canvas</span>
                </div>
              </SelectItem>
              <SelectItem value="stretch">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Stretch</span>
                  <span className="text-xs text-muted-foreground">Stretch to exact dimensions</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function AnalysisStatus({
  isAnalyzing,
  imageAnalysis,
}: {
  isAnalyzing: boolean
  imageAnalysis: string | null
}) {
  if (isAnalyzing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Analyzing element image with AI...
          </p>
        </div>
      </div>
    )
  }

  if (imageAnalysis) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
        <h4 className="mb-1 text-sm font-semibold text-green-900 dark:text-green-100">
          AI Analysis:
        </h4>
        <p className="text-xs text-green-800 dark:text-green-200">{imageAnalysis}</p>
      </div>
    )
  }

  return null
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
      <p className="text-sm font-semibold text-red-900 dark:text-red-100">Error:</p>
      <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
    </div>
  )
}

function PromptInput({
  value,
  onChange,
  hasAnalysis,
}: {
  value: string
  onChange: (value: string) => void
  hasAnalysis: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt">Description (Optional)</Label>
      <Textarea
        id="prompt"
        placeholder={
          hasAnalysis
            ? "Leave empty to use AI analysis, or add custom instructions..."
            : "Describe what you want to create in the selected region..."
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
      <p className="text-xs text-muted-foreground">
        {hasAnalysis
          ? "AI has analyzed the element image. Custom prompt will override."
          : "Add a description to guide the AI generation"}
      </p>
    </div>
  )
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  description: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium tabular-nums">{value.toFixed(1)}</span>
      </div>
      <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step} />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function ProcessButton({
  onProcess,
  isProcessing,
  canProcess,
  processingStatus,
}: {
  onProcess: () => void
  isProcessing: boolean
  canProcess: boolean
  processingStatus: string
}) {
  return (
    <div className="border-t p-4">
      <Button className="w-full" size="lg" onClick={onProcess} disabled={!canProcess || isProcessing}>
        {isProcessing ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {processingStatus || "Processing..."}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </>
        )}
      </Button>
      {!canProcess && !isProcessing && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Select a region on the canvas to continue
        </p>
      )}
      {isProcessing && processingStatus && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{processingStatus}</p>
      )}
    </div>
  )
}
