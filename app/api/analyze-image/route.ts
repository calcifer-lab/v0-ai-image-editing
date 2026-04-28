import { NextRequest, NextResponse } from "next/server"
import type { AnalyzeImageRequest, AnalyzeImageResponse, ApiErrorResponse } from "@/types"
import {
  IMAGE_ANALYSIS_PROMPT,
  openRouterHeaders,
  validateImageDataUrl,
  callGoogleGenerate,
  extractGoogleText,
  GOOGLE_VISION_MODEL,
  type OpenRouterContentPart,
} from "@/lib/api"

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
        const result = await callGoogleGenerate(GOOGLE_VISION_MODEL, content, googleApiKey)
        if (result.ok) {
          const analysis = extractGoogleText(result.data) || "No analysis available"
          return NextResponse.json({
            analysis,
            meta: { model: `google-${GOOGLE_VISION_MODEL}` },
          })
        }
        failures.push(`Google: ${result.status} ${result.error}`)
        console.error("[AnalyzeImage] Google API error:", result.status, result.error)
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Google call threw"
        failures.push(`Google: ${msg}`)
        console.error("[AnalyzeImage] Google direct error:", error)
      }
    }

    // 2. OpenRouter (gpt-4o-mini) fallback
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (openRouterApiKey) {
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
        return NextResponse.json({
          analysis,
          meta: { model: "openai/gpt-4o-mini", usage: data.usage },
        })
      }

      const errorText = await response.text()
      failures.push(`OpenRouter: ${response.status} ${errorText}`)
      console.error("OpenRouter API error:", errorText)
    }

    const reason = failures.length > 0 ? failures.join("; ") : "no provider configured"
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
