import { NextRequest, NextResponse } from "next/server"
import type { AnalyzeImageRequest, AnalyzeImageResponse, ApiErrorResponse } from "@/types"
import { IMAGE_ANALYSIS_PROMPT } from "@/lib/api"
import { validateImageDataUrl } from "@/lib/api"

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

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || IMAGE_ANALYSIS_PROMPT },
              { type: "image_url", image_url: { url: validatedImage.image.dataUrl } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter API error:", errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content || "No analysis available"

    return NextResponse.json({
      analysis,
      meta: {
        model: "openai/gpt-4o-mini",
        usage: data.usage,
      },
    })
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze image" },
      { status: 500 }
    )
  }
}
