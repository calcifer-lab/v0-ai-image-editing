/**
 * API 工具函数导出 (sharp-free).
 *
 * IMPORTANT: do NOT re-export "./resize-mask" here. That module loads sharp,
 * and routes that don't need server-side mask resizing (e.g. /api/remove-background)
 * import this barrel — re-exporting resize-mask would pull sharp's ~30MB native
 * binaries into every consumer's bundle and push small Vercel functions over the
 * 50MB limit (which silently drops the route → 404).
 *
 * Routes that do need mask resizing must import directly:
 *   import { resizeMaskToMatchImage } from "@/lib/api/resize-mask"
 */

export * from "./replicate"
export * from "./prompts"
export * from "./openrouter"
export * from "./google-ai"
