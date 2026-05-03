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
}

export function newRequestId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `req_${timestamp}_${random}`
}

const REQUEST_ID_PATTERN = /^req_\d+_[a-z0-9]{4,12}$/i

// Trust the client-provided x-request-id when it matches our format so a single user
// action can be correlated across analyze → inpaint → fusion logs. Anything malformed
// (or missing) falls back to a fresh server-side id so we never lose stage coverage.
export function resolveRequestId(headerValue: string | null | undefined): string {
  if (!headerValue) return newRequestId()
  const trimmed = headerValue.trim()
  if (!trimmed || trimmed.length > 64) return newRequestId()
  if (!REQUEST_ID_PATTERN.test(trimmed)) return newRequestId()
  return trimmed
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
