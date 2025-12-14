import { NextRequest, NextResponse } from "next/server"
import type { AnalyzeImageRequest, AnalyzeImageResponse, ApiErrorResponse } from "@/types"
import { IMAGE_ANALYSIS_PROMPT } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeImageResponse | ApiErrorResponse>> {
  try {
    const body: AnalyzeImageRequest = await request.json()
    const { image, prompt } = body

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    // 确保是 data URL 格式
    const imageUrl = image.startsWith("data:") ? image : `data:image/png;base64,${image}`

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
              { type: "image_url", image_url: { url: imageUrl } },
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
