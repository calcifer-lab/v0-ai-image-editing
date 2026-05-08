/**
 * Image-input validation utilities.
 *
 * Kept in a sharp-free module so routes that only need validation (e.g.
 * /api/remove-background) don't bundle sharp's ~30MB native binaries via
 * Vercel's tracing of @/lib/api re-exports.
 */

const IMAGE_DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/

export interface ValidatedImageInput {
  dataUrl: string
  mimeType: string
  bytes: number
}

export interface ImageValidationOptions {
  fieldName?: string
  maxBytes?: number
}

export function isValidImage(base64: string): boolean {
  return base64.startsWith("data:image/")
}

export function estimateBase64DecodedBytes(base64Payload: string): number {
  const normalized = base64Payload.replace(/\s/g, "")
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

export function validateImageDataUrl(
  value: string,
  options: ImageValidationOptions = {}
): { ok: true; image: ValidatedImageInput } | { ok: false; error: string; status: number } {
  const fieldName = options.fieldName || "image"

  if (!value || typeof value !== "string") {
    return { ok: false, error: `${fieldName} is required`, status: 400 }
  }

  const trimmed = value.trim()
  const match = trimmed.match(IMAGE_DATA_URL_REGEX)
  if (!match) {
    return {
      ok: false,
      error: `${fieldName} must be a valid base64 data URL (for example data:image/png;base64,...)`,
      status: 400,
    }
  }

  const [, mimeType, base64Payload] = match
  const bytes = estimateBase64DecodedBytes(base64Payload)

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { ok: false, error: `${fieldName} could not be decoded`, status: 400 }
  }

  if (options.maxBytes && bytes > options.maxBytes) {
    const maxMb = (options.maxBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")
    return {
      ok: false,
      error: `${fieldName} is too large. Maximum supported size is ${maxMb}MB.`,
      status: 413,
    }
  }

  return {
    ok: true,
    image: {
      dataUrl: trimmed,
      mimeType,
      bytes,
    },
  }
}
