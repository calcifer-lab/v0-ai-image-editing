export type Stage =
  | "upload"
  | "mask"
  | "process"
  | "analyze"
  | "inpaint"
  | "composite"
  | "fusion"
  | "result"

export type Mode = "ai" | "composite"
export type Level = "info" | "warn" | "error"

export interface StageEvent {
  requestId: string
  stage: Stage
  mode?: Mode
  provider?: string
  model?: string
  input_meta?: { width?: number; height?: number; bytes?: number }
  elapsed_ms?: number
  error_code?: string
  fallback_from?: string
  fallback_to?: string
  message?: string
  /** AI Compose: whether a local composite preview was supplied as placement anchor. */
  composite_used?: boolean
  /** AI Compose: whether element analysis text was injected into the prompt. */
  analysis_used?: boolean
  /** AI Compose: normalized mask bounding box, x0/y0/x1/y1 in [0,1]. */
  mask_bbox?: { x0: number; y0: number; x1: number; y1: number }
  /** Inpaint fallback: reference_image was provided but the serving model could not consume it. */
  reference_dropped?: boolean
}

export function newRequestId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `req_${timestamp}_${random}`
}

export function logStageEvent(level: Level, event: StageEvent): void {
  if (!event?.requestId || !event?.stage) {
    throw new Error("logStageEvent requires requestId and stage")
  }

  const payload = {
    level,
    ...event,
    timestamp: new Date().toISOString(),
  }

  const line = `[stage:${event.stage}] ${JSON.stringify(payload)}`

  if (level === "warn") {
    console.warn(line)
    return
  }

  if (level === "error") {
    console.error(line)
    return
  }

  console.info(line)
}
