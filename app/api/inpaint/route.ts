import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes for model processing

interface InpaintRequest {
  base_image: string // B image (base64)
  mask_image: string // Mask (base64)
  reference_image?: string // A image (base64)
  prompt: string
  options?: {
    strength?: number
    steps?: number
    guidance_scale?: number
  }
}

interface InpaintResponse {
  result_image: string
  meta: {
    model: string
    duration_ms: number
  }
}

// Helper function to validate image format
function isValidImage(base64: string): boolean {
  return base64.startsWith("data:image/")
}

// Build the inpainting prompt for Gemini
function buildInpaintPrompt(userPrompt: string, hasReference: boolean): string {
  const baseInstruction = `You are a world-class digital artist and expert image editor. Your specialty is creating seamless, professional-quality image edits that are indistinguishable from original artwork.

## Task Overview
I'm providing you with images for a precise inpainting operation:
1. **Base Image**: The original image requiring editing
2. **Mask Image**: WHITE areas = regions to modify; BLACK areas = preserve exactly as-is

## Your Mission
${userPrompt}

## Pre-Edit Analysis (Perform Silently)
Before editing, analyze the base image to identify:
- Art style (realistic, cartoon, anime, 3D render, illustration, photographic, etc.)
- Cultural/thematic context (mythology, modern, fantasy, historical, regional aesthetics, etc.)
- Color palette, lighting setup, and rendering technique
- Level of detail and texture quality

## Quality Requirements (CRITICAL)
1. **Style Fidelity**: Replicate the EXACT artistic style of the base image - same rendering technique, line quality, shading method, and detail level
2. **Seamless Integration**: Zero visible seams, artifacts, or inconsistencies at mask boundaries
3. **Lighting Coherence**: Match light direction, shadow softness, highlights, reflections, and ambient occlusion precisely
4. **Physical Accuracy**: Ensure proper anatomy, perspective, proportions, and physics
5. **Cultural/Thematic Authenticity**: Preserve the authentic characteristics of any cultural, mythological, or thematic elements - respect their symbolic meanings and traditional representations
6. **Color Harmony**: Use colors that naturally belong to the existing palette
7. **Texture Consistency**: Match surface textures, material properties, and fine details

## Output Specification
Generate a complete, high-quality edited image where the inpainted region appears as an original part of the artwork. The edit should be professional-grade and imperceptible.`

  if (hasReference) {
    return `${baseInstruction}

## Reference Image Guidance
A reference image is provided. Use it as follows:
- Study its key visual characteristics, proportions, colors, and distinctive features
- **ADAPT** (not copy) these elements to match the base image's unique style and aesthetic
- Transform the reference content to feel native to the base image's world
- Preserve the essence while ensuring perfect stylistic harmony with the base image`
  }

  return baseInstruction
}

export async function POST(request: NextRequest): Promise<NextResponse<InpaintResponse | { error: string }>> {
  const startTime = Date.now()

  try {
    const body: InpaintRequest = await request.json()
    const { base_image, mask_image, reference_image, prompt, options = {} } = body

    // Validation
    if (!base_image || !mask_image || !prompt) {
      return NextResponse.json({ error: "base_image, mask_image, and prompt are required" }, { status: 400 })
    }

    if (!isValidImage(base_image) || !isValidImage(mask_image)) {
      return NextResponse.json({ error: "Invalid image format. Must be base64 encoded image." }, { status: 400 })
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openrouterApiKey) {
      console.warn("OpenRouter API key not configured. Returning mock result.")
      return mockInpaintResult(base_image, startTime)
    }

    // Build content array with images
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: buildInpaintPrompt(prompt, !!reference_image),
      },
      {
        type: "text",
        text: "Base image to edit:",
      },
      {
        type: "image_url",
        image_url: { url: base_image },
      },
      {
        type: "text",
        text: "Mask image (edit WHITE areas only):",
      },
      {
        type: "image_url",
        image_url: { url: mask_image },
      },
    ]

    // Add reference image if provided
    if (reference_image && isValidImage(reference_image)) {
      contentArray.push(
        {
          type: "text",
          text: "Reference image for style/content guidance:",
        },
        {
          type: "image_url",
          image_url: { url: reference_image },
        }
      )
    }

    // Call OpenRouter API with Gemini 2.5 Flash Image model
    console.log("[Inpaint] Calling OpenRouter Gemini 2.5 Flash Image...")
    
    const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterApiKey}`,
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "AI Image Editor",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image", // Gemini 2.5 Flash Image (Nano Banana)
        messages: [
          {
            role: "user",
            content: contentArray,
          },
        ],
        modalities: ["image", "text"], // Enable image output
        // Optional: configure aspect ratio based on input image
        // image_config: { aspect_ratio: "1:1" }
      }),
    })

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text()
      console.error("OpenRouter API error:", errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${openrouterResponse.status} - ${errorText}` },
        { status: openrouterResponse.status }
      )
    }

    const result = await openrouterResponse.json()
    console.log("[Inpaint] OpenRouter response received")

    // Extract generated image from response
    const message = result.choices?.[0]?.message
    const generatedImages = message?.images

    if (!generatedImages || generatedImages.length === 0) {
      console.error("No images in response:", JSON.stringify(result, null, 2))
      return NextResponse.json(
        { error: "Model did not generate an image. The response may contain only text." },
        { status: 500 }
      )
    }

    // Get the first generated image (should be base64 data URL)
    const imageUrl = generatedImages[0]?.image_url?.url
    if (!imageUrl) {
      return NextResponse.json({ error: "Invalid image format in response" }, { status: 500 })
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      result_image: imageUrl,
      meta: {
        model: "gemini-2.5-flash-image",
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("Error in inpainting:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process inpainting request" },
      { status: 500 }
    )
  }
}

// Mock function for development/testing
function mockInpaintResult(base_image: string, startTime: number): NextResponse<InpaintResponse> {
  const duration = Date.now() - startTime + 2000 // Simulate 2 second processing

  return NextResponse.json({
    result_image: base_image, // Return original image as placeholder
    meta: {
      model: "mock-inpainting",
      duration_ms: duration,
    },
  })
}
