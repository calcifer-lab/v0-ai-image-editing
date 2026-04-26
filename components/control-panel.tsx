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
  processingProgress?: number
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
  processingProgress = 0,
  error = null,
  imageAnalysis = null,
  isAnalyzing = false,
}: ControlPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Fix Parameters</h3>
        <p className="text-sm text-muted-foreground">Compose only what needs changing</p>
      </div>

      <EditModeSection params={params} onParamsChange={onParamsChange} />

      <div className="flex-1 space-y-6 overflow-auto p-4">
        {error && <ErrorDisplay error={error} />}

        {params.editMode === "composite" ? (
          <DirectPasteSettings params={params} onParamsChange={onParamsChange} />
        ) : (
          <AIGenerateSettings
            params={params}
            onParamsChange={onParamsChange}
          />
        )}
      </div>

      <ProcessButton
        onProcess={onProcess}
        isProcessing={isProcessing}
        canProcess={canProcess}
        processingStatus={processingStatus}
        processingProgress={processingProgress}
        editMode={params.editMode}
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Patch Mode</Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModeButton
            active={params.editMode === "composite"}
            onClick={() => onParamsChange({ ...params, editMode: "composite" })}
            icon={Layers}
            label="Direct Patch"
            description="Place element as-is"
          />
          <ModeButton
            active={params.editMode === "ai"}
            onClick={() => onParamsChange({ ...params, editMode: "ai" })}
            icon={Wand2}
            label="AI Generate"
            description="AI reinterprets patch"
          />
        </div>
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
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
        active
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-accent"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-center">
        <div className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  )
}

function DirectPasteSettings({
  params,
  onParamsChange,
}: {
  params: EditParams
  onParamsChange: (params: EditParams) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="border-2 bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Direct Patch Mode</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Apply the selected reference directly to the chosen area when you already know exactly what needs changing.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <OutputDimensionsSection params={params} onParamsChange={onParamsChange} />
    </div>
  )
}

function AIGenerateSettings({
  params,
  onParamsChange,
}: {
  params: EditParams
  onParamsChange: (params: EditParams) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="border-2 bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">AI Generate Mode</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Let AI reinterpret the patch reference so the fix matches the surrounding image, style, and context.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <PromptInput
        value={params.prompt}
        onChange={(prompt) => onParamsChange({ ...params, prompt })}
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

      <OutputDimensionsSection params={params} onParamsChange={onParamsChange} />
    </div>
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
    <Card className="border-2 bg-card p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Output Dimensions</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aspect-ratio" className="text-sm">
            Aspect Ratio
          </Label>
          <Select
            value={params.outputDimensions.aspectRatio}
            onValueChange={(value: AspectRatio) =>
              onParamsChange({
                ...params,
                outputDimensions: { ...params.outputDimensions, aspectRatio: value },
              })
            }
          >
            <SelectTrigger id="aspect-ratio">
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
            <Label className="text-sm">Custom Dimensions</Label>
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
          <Label htmlFor="scale-mode" className="text-sm">
            Scale Mode
          </Label>
          <Select
            value={params.outputDimensions.scaleMode}
            onValueChange={(value: ScaleMode) =>
              onParamsChange({
                ...params,
                outputDimensions: { ...params.outputDimensions, scaleMode: value },
              })
            }
          >
            <SelectTrigger id="scale-mode">
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
    </Card>
  )
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
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt">Description (Optional)</Label>
      <Textarea
        id="prompt"
        placeholder="Describe what you want to create in the selected region..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
      <p className="text-xs text-muted-foreground">
        Add a description to guide the AI generation
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
  processingProgress,
  editMode,
}: {
  onProcess: () => void
  isProcessing: boolean
  canProcess: boolean
  processingStatus: string
  processingProgress: number
  editMode: "ai" | "composite"
}) {
  const buttonText = "FIX"
  const Icon = editMode === "composite" ? Layers : Sparkles

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
            <Icon className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>
      {!canProcess && !isProcessing && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Select a region on the canvas to continue
        </p>
      )}
      {isProcessing && (
        <div className="mt-3 space-y-2">
          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
          {/* Status text with percentage */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{processingStatus}</span>
            <span className="font-mono font-semibold">{processingProgress}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
