import { NextRequest, NextResponse } from "next/server"
import type { AnalyzeImageRequest, AnalyzeImageResponse, ApiErrorResponse } from "@/types"
import {
  IMAGE_ANALYSIS_PROMPT,
  openRouterHeaders,
  validateImageDataUrl,
  callGoogleGenerate,
  extractGoogleText,
  getImageDimensions,
  GOOGLE_VISION_MODEL,
  type OpenRouterContentPart,
} from "@/lib/api"
import { logStageEvent, resolveRequestId } from "@/lib/observability/log-stage"

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
    const requestId = resolveRequestId(request.headers.get("x-request-id"))
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
            meta: { model: `google-${GOOGLE_VISION_MODEL}`, requestId },
          })
        }
        failures.push(`Google: ${result.status} ${result.error}`)
        logStageEvent("warn", {
          requestId,
          stage: "analyze",
          provider: "google",
          error_code: `HTTP_${result.status}`,
          fallback_from: "google",
          fallback_to: "openrouter",
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
          fallback_from: "google",
          fallback_to: "openrouter",
          message: msg,
        })
        console.error("[AnalyzeImage] Google direct error:", error)
      }
    }

    // 2. OpenRouter (gpt-4o-mini) fallback
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (openRouterApiKey) {
      const openRouterStartedAt = Date.now()
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders(openRouterApiKey),
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content }],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = data.choices?.[0]?.message?.content || "No analysis available"
        logStageEvent("info", {
          requestId,
          stage: "analyze",
          provider: "openrouter",
          model: "openai/gpt-4o-mini",
          elapsed_ms: Date.now() - openRouterStartedAt,
        })
        return NextResponse.json({
          analysis,
          meta: {
            model: "openai/gpt-4o-mini",
            usage: data.usage,
            requestId,
            fallback_from: "google",
            fallback_to: "openrouter",
          },
        })
      }

      const errorText = await response.text()
      failures.push(`OpenRouter: ${response.status} ${errorText}`)
      logStageEvent("error", {
        requestId,
        stage: "analyze",
        provider: "openrouter",
        error_code: `HTTP_${response.status}`,
        message: errorText,
      })
      console.error("OpenRouter API error:", errorText)
    }

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
