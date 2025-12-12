"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from "lucide-react"
import type { EditParams } from "./image-editor"

interface ControlPanelProps {
  params: EditParams
  onParamsChange: (params: EditParams) => void
  onProcess: () => void
  isProcessing: boolean
  canProcess: boolean
}

export default function ControlPanel({
  params,
  onParamsChange,
  onProcess,
  isProcessing,
  canProcess,
}: ControlPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Edit Parameters</h3>
        <p className="text-sm text-muted-foreground">Configure how AI will blend the elements</p>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-4">
        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Description (Optional)</Label>
          <Textarea
            id="prompt"
            placeholder="Describe what you want to create in the selected region..."
            value={params.prompt}
            onChange={(e) => onParamsChange({ ...params, prompt: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Add a description to guide the AI generation</p>
        </div>

        {/* Strength */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Generation Strength</Label>
            <span className="text-sm font-medium tabular-nums">{params.strength.toFixed(1)}</span>
          </div>
          <Slider
            value={[params.strength]}
            onValueChange={(v) => onParamsChange({ ...params, strength: v[0] })}
            min={0.1}
            max={1.0}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">Higher values generate more creative content</p>
        </div>

        {/* Guidance Scale */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Guidance Scale</Label>
            <span className="text-sm font-medium tabular-nums">{params.guidance.toFixed(1)}</span>
          </div>
          <Slider
            value={[params.guidance]}
            onValueChange={(v) => onParamsChange({ ...params, guidance: v[0] })}
            min={1}
            max={20}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground">How closely to follow the reference image</p>
        </div>

        {/* Preserve Structure */}
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

      <div className="border-t p-4">
        <Button className="w-full" size="lg" onClick={onProcess} disabled={!canProcess || isProcessing}>
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
        {!canProcess && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Select a region on the canvas to continue</p>
        )}
      </div>
    </Card>
  )
}
