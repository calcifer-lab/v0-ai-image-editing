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
                  `Analyze this reference image for PRECISE object extraction and reproduction. Your response MUST follow this exact format:

**Main Subject/Object**: [Provide a COMPLETE, SPECIFIC description of ALL visible objects. Include EVERY layer and component. Examples: 
- "grilled chicken wings on a metal tray, with a wire rack pressing down on top of the wings"
- "flaming fire wheels (风火轮) with golden rings and orange flames"
- "a plate of food with sauce, garnish, and chopsticks resting on top"
This description will be used to reproduce the EXACT content, so be thorough!]

**Layered Structure** (CRITICAL):
- List EVERY layer from bottom to top
- Example: "Bottom: metal tray → Middle: grilled chicken wings with sauce → Top: wire/metal rack pressing down on the food"
- Be explicit about what is ON TOP of what
- Do NOT skip any layers!

**Visual Details**:
- Exact colors of each component
- Textures (glossy, matte, metallic, crispy, etc.)
- Shapes and proportions
- Any dripping sauce, steam, or effects

**Art Style**: photorealistic photo, cartoon, 3D render, anime, illustration, etc.

IMPORTANT: The goal is to EXACTLY REPRODUCE this image content. Every detail matters - especially the LAYERED STRUCTURE (like a rack on top of food). Do not simplify or omit any components!`,
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
