import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

interface AnalyzeImageRequest {
  image: string // base64 encoded image
  prompt?: string
}

export async function POST(request: NextRequest) {
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

    // Convert base64 to data URL if needed
    const imageUrl = image.startsWith("data:") ? image : `data:image/png;base64,${image}`

    // Call OpenRouter API with GPT-4o-mini
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
              {
                type: "text",
                text:
                  prompt ||
                  "Analyze this image in detail. Describe the main objects, their positions, colors, textures, and any notable features. Focus on elements that could be referenced for image editing or inpainting tasks.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
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
        { status: response.status },
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
      { status: 500 },
    )
  }
}
