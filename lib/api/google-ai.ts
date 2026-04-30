/**
 * Direct Google AI Studio (Generative Language API) client.
 *
 * We support two models:
 *   - `gemini-2.5-flash-image`  → image generation / fusion (a.k.a. "Nano Banana", GA)
 *   - `gemini-2.0-flash`        → vision analysis (text-out)
 *
 * Note: the previous preview alias `gemini-2.5-flash-image-preview` was
 * retired by Google and now returns 404 from v1beta `generateContent`. Always
 * use the GA model id below.
 *
 * Why this exists: OpenRouter started rejecting our account at the Google
 * provider routing layer (403 "Terms Of Service violation" with
 * `provider_name: null`, no entry in their Activity/Logs). Direct calls to
 * Google bypass that and let the product keep working.
 */

const GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

interface GooglePart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

/**
 * Convert a single OpenRouter-style content part to Google's `parts` shape.
 * Throws if a non-data-URL image_url is passed (Google direct API only accepts inline base64).
 */
function partToGoogle(part: OpenRouterContentPart): GooglePart {
  if (part.type === "text") {
    return { text: part.text }
  }
  const url = part.image_url.url
  const match = url.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw new Error("Google direct API requires data: URLs for images, got non-data URL")
  }
  return { inline_data: { mime_type: match[1], data: match[2] } }
}

interface GoogleGenerateOptions {
  responseModalities?: Array<"TEXT" | "IMAGE">
}

interface GoogleGenerateResult {
  ok: boolean
  status: number
  /** Raw response body when ok=true */
  data?: unknown
  /** Error string when ok=false */
  error?: string
}

/**
 * Call Google's generateContent endpoint. Returns ok=false (with status+error)
 * on any non-2xx so callers can decide whether to fall back to another provider.
 */
export async function callGoogleGenerate(
  model: string,
  content: OpenRouterContentPart[],
  apiKey: string,
  options: GoogleGenerateOptions = {}
): Promise<GoogleGenerateResult> {
  const url = `${GOOGLE_API_BASE}/${model}:generateContent`

  let parts: GooglePart[]
  try {
    parts = content.map(partToGoogle)
  } catch (error) {
    return {
      ok: false,
      status: 400,
      error: error instanceof Error ? error.message : "Failed to convert content to Google parts",
    }
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
  }
  if (options.responseModalities && options.responseModalities.length > 0) {
    body.generationConfig = { responseModalities: options.responseModalities }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "<no body>")
    return { ok: false, status: response.status, error: errorText }
  }

  const data = await response.json()
  return { ok: true, status: response.status, data }
}

/**
 * Extract a generated image (as a `data:image/png;base64,...` URL) from a
 * Google generateContent response. Returns null if no image part is found.
 */
export function extractGoogleImage(data: unknown): string | null {
  const candidates = (data as { candidates?: Array<{ content?: { parts?: GooglePart[] } }> }).candidates
  if (!candidates || candidates.length === 0) return null
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      if (part.inline_data?.data) {
        const mime = part.inline_data.mime_type || "image/png"
        return `data:${mime};base64,${part.inline_data.data}`
      }
    }
  }
  return null
}

/**
 * Extract concatenated text from a Google generateContent response.
 */
export function extractGoogleText(data: unknown): string {
  const candidates = (data as { candidates?: Array<{ content?: { parts?: GooglePart[] } }> }).candidates
  if (!candidates || candidates.length === 0) return ""
  const chunks: string[] = []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      if (typeof part.text === "string") chunks.push(part.text)
    }
  }
  return chunks.join("")
}

export const GOOGLE_IMAGE_MODEL = "gemini-2.5-flash-image"
export const GOOGLE_VISION_MODEL = "gemini-2.0-flash"
