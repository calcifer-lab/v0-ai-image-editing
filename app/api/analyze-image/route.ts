import { NextRequest, NextResponse } from "next/server"
import type { AnalyzeImageRequest, AnalyzeImageResponse, ApiErrorResponse } from "@/types"
import {
  IMAGE_ANALYSIS_PROMPT,
  validateImageDataUrl,
  callGoogleGenerate,
  extractGoogleText,
  getImageDimensions,
  GOOGLE_VISION_MODEL,
  type OpenRouterContentPart,
} from "@/lib/api"
import { logStageEvent, newRequestId } from "@/lib/observability/log-stage"

export const runtime = "nodejs"
export const maxDuration = 60
const MAX_ANALYZE_IMAGE_BYTES = 10 * 1024 * 1024

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeImageResponse | ApiErrorResponse>> {
  try {
    const body: AnalyzeImageRequest = await request.json()
    const { image, prompt } = body

    const imageInput =
      typeof image === "string" && image.startsWith("data:")
        ? image
        : `data:image/png;base64,${image ?? ""}`
    const validatedImage = validateImageDataUrl(imageInput, {
      fieldName: "image",
      maxBytes: MAX_ANALYZE_IMAGE_BYTES,
    })
    if (!validatedImage.ok) {
      return NextResponse.json({ error: validatedImage.error }, { status: validatedImage.status })
    }

    const dimensions = await getImageDimensions(validatedImage.image.dataUrl)
    const requestId = newRequestId()
    logStageEvent("info", {
      requestId,
      stage: "analyze",
      mode: "ai",
      input_meta: {
        width: dimensions.width,
        height: dimensions.height,
        bytes: validatedImage.image.bytes,
      },
      message: "analyze-image request received",
    })

    const finalPrompt = prompt || IMAGE_ANALYSIS_PROMPT
    const content: OpenRouterContentPart[] = [
      { type: "text", text: finalPrompt },
      { type: "image_url", image_url: { url: validatedImage.image.dataUrl } },
    ]

    const failures: string[] = []

    // 1. Google AI Studio direct (Gemini Flash vision)
    const googleApiKey = process.env.GOOGLE_API_KEY
    if (googleApiKey) {
      try {
        const googleStartedAt = Date.now()
        const result = await callGoogleGenerate(GOOGLE_VISION_MODEL, content, googleApiKey)
        if (result.ok) {
          const analysis = extractGoogleText(result.data) || "No analysis available"
          logStageEvent("info", {
            requestId,
            stage: "analyze",
            provider: "google",
            model: GOOGLE_VISION_MODEL,
            elapsed_ms: Date.now() - googleStartedAt,
          })
          return NextResponse.json({
            analysis,
            meta: { model: `google-${GOOGLE_VISION_MODEL}` },
          })
        }
        failures.push(`Google: ${result.status} ${result.error}`)
        logStageEvent("warn", {
          requestId,
          stage: "analyze",
          provider: "google",
          error_code: `HTTP_${result.status}`,
          message: result.error,
        })
        console.error("[AnalyzeImage] Google API error:", result.status, result.error)
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Google call threw"
        failures.push(`Google: ${msg}`)
        logStageEvent("warn", {
          requestId,
          stage: "analyze",
          provider: "google",
          error_code: "GOOGLE_CALL_THROW",
          message: msg,
        })
        console.error("[AnalyzeImage] Google direct error:", error)
      }
    }

    // OpenRouter fallback retired — proxy account no longer serves OpenAI/Google models.

    const reason = failures.length > 0 ? failures.join("; ") : "no provider configured"
    logStageEvent("error", {
      requestId,
      stage: "analyze",
      error_code: "ALL_PROVIDERS_FAILED",
      message: reason,
    })
    return NextResponse.json(
      { error: `Image analysis unavailable: ${reason}` },
      { status: 502 }
    )
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze image" },
      { status: 500 }
    )
  }
}
