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

// Use Gemini 2.5 Flash for image generation with reference image support
async function tryGeminiImageGeneration(
  base_image: string,
  mask_image: string,
  reference_image: string,
  prompt: string,
  apiKey: string,
  startTime: number
): Promise<NextResponse<InpaintResponse | { error: string }>> {
  console.log("[Inpaint] Using Gemini 2.5 Flash Image Generation...")
  console.log("[Inpaint] Prompt:", prompt)

  // Build the content array with all images
  const content = [
    {
      type: "text",
      text: `You are a precision image compositor. Your task is to COPY AND PASTE the exact content from the REFERENCE IMAGE into the masked region of the TARGET IMAGE.

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. REFERENCE IMAGE shows the EXACT object you must reproduce. Look at EVERY detail:
   - All visible objects and elements
   - Containers, supports, accessories
   - The LAYERED STRUCTURE (what's on top of what)
   - Colors, textures, shapes
   
2. You must FAITHFULLY REPRODUCE the reference content - NOT create something similar or different!
   - Reproduce EXACTLY what is shown in the reference image
   - Do NOT substitute with different objects
   - Do NOT remove or add layers
   - PRESERVE the complete structural hierarchy

3. MASK IMAGE shows WHERE to place this content (white/bright area = target region)

4. Generate the TARGET IMAGE with the masked area replaced by the EXACT content from REFERENCE IMAGE
   - Adapt the style/colors to match the TARGET IMAGE's art style
   - But keep ALL structural elements from the reference
   - Blend edges seamlessly

User's specific request: ${prompt}

OUTPUT: Generate ONLY the edited image. The masked area MUST contain a faithful reproduction of ALL elements visible in the REFERENCE IMAGE, adapted to the target image's style.`
    },
    {
      type: "text",
      text: "REFERENCE IMAGE (the object/element to insert):"
    },
    {
      type: "image_url",
      image_url: { url: reference_image }
    },
    {
      type: "text",
      text: "TARGET IMAGE (the image to edit):"
    },
    {
      type: "image_url",
      image_url: { url: base_image }
    },
    {
      type: "text",
      text: "MASK IMAGE (white area = where to place reference content):"
    },
    {
      type: "image_url",
      image_url: { url: mask_image }
    }
  ]

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-preview-image-generation",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Inpaint] Gemini API error:", errorText)
    return NextResponse.json(
      { error: `Gemini API error: ${response.status} - ${errorText}` },
      { status: response.status }
    )
  }

  const data = await response.json()
  console.log("[Inpaint] Gemini response received")

  // Extract the generated image from the response
  const message = data.choices?.[0]?.message
  
  // Check for image in the message.images array (Gemini format)
  if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
    const imageData = message.images[0]
    let resultImage: string
    
    if (typeof imageData === "string") {
      resultImage = imageData.startsWith("data:") ? imageData : `data:image/png;base64,${imageData}`
    } else if (imageData?.image_url?.url) {
      resultImage = imageData.image_url.url
    } else {
      console.error("[Inpaint] Unexpected image format:", imageData)
      return NextResponse.json({ error: "Unexpected image format in response" }, { status: 500 })
    }

    const duration = Date.now() - startTime
    return NextResponse.json({
      result_image: resultImage,
      meta: {
        model: "gemini-2.5-flash-image",
        duration_ms: duration,
      },
    })
  }

  // Check for base64 image in content
  const content_text = message?.content || ""
  const base64Match = content_text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
  if (base64Match) {
    const duration = Date.now() - startTime
    return NextResponse.json({
      result_image: base64Match[0],
      meta: {
        model: "gemini-2.5-flash-image",
        duration_ms: duration,
      },
    })
  }

  console.error("[Inpaint] No image found in Gemini response:", JSON.stringify(data).substring(0, 500))
  return NextResponse.json({ error: "No image generated by Gemini" }, { status: 500 })
}

// Get image dimensions from base64
async function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  // Extract the base64 data
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")
  
  // Check for PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  }
  
  // Check for JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height }
      }
      const length = buffer.readUInt16BE(offset + 2)
      offset += 2 + length
    }
  }
  
  // Default fallback
  return { width: 512, height: 512 }
}

// Resize mask to match image dimensions using canvas-like approach
async function resizeMaskToMatchImage(maskBase64: string, targetWidth: number, targetHeight: number): Promise<string> {
  // For server-side, we'll use sharp if available, or return original if dimensions already match
  const maskDims = await getImageDimensions(maskBase64)
  
  if (maskDims.width === targetWidth && maskDims.height === targetHeight) {
    return maskBase64
  }
  
  console.log(`[Inpaint] Resizing mask from ${maskDims.width}x${maskDims.height} to ${targetWidth}x${targetHeight}`)
  
  // Use dynamic import for sharp
  try {
    const sharp = (await import("sharp")).default
    const base64Data = maskBase64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    
    const resizedBuffer = await sharp(buffer)
      .resize(targetWidth, targetHeight, { fit: "fill" })
      .png()
      .toBuffer()
    
    return `data:image/png;base64,${resizedBuffer.toString("base64")}`
  } catch (error) {
    console.error("[Inpaint] Sharp not available, cannot resize mask:", error)
    // Return original mask and hope for the best
    return maskBase64
  }
}

// Helper to poll for Replicate prediction result
async function pollReplicatePrediction(
  predictionUrl: string,
  apiKey: string,
  maxAttempts = 120,
  intervalMs = 2000
): Promise<{ status: string; output?: string | string[]; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(predictionUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`)
    }

    const prediction = await response.json()
    console.log(`[Inpaint] Poll ${i + 1}/${maxAttempts}: status = ${prediction.status}`)

    if (prediction.status === "succeeded") {
      return prediction
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      return { status: prediction.status, error: prediction.error || "Prediction failed" }
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Prediction timed out")
}

// Fetch image from URL and convert to base64
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const contentType = response.headers.get("content-type") || "image/png"
  return `data:${contentType};base64,${base64}`
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

    console.log("[Inpaint] Has reference image:", !!reference_image)
    console.log("[Inpaint] Prompt:", prompt)

    // If we have a reference image, prefer Gemini 2.5 Flash for better reference-guided generation
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (reference_image && openRouterApiKey) {
      console.log("[Inpaint] Using Gemini for reference-guided inpainting...")
      try {
        const geminiResult = await tryGeminiImageGeneration(
          base_image,
          mask_image,
          reference_image,
          prompt,
          openRouterApiKey,
          startTime
        )
        // Check if Gemini succeeded
        const geminiJson = await geminiResult.json()
        if (geminiJson.result_image) {
          return NextResponse.json(geminiJson)
        }
        console.log("[Inpaint] Gemini failed, falling back to FLUX...")
      } catch (geminiError) {
        console.error("[Inpaint] Gemini error, falling back to FLUX:", geminiError)
      }
    }

    // Check for Replicate API key for FLUX fallback
    const replicateApiKey = process.env.REPLICATE_API_KEY
    
    if (!replicateApiKey) {
      console.warn("[Inpaint] REPLICATE_API_KEY not configured. Returning mock result.")
      return mockInpaintResult(base_image, startTime)
    }

    console.log("[Inpaint] Using FLUX.1 Fill Pro for inpainting...")

    // Get image dimensions and resize mask to match
    const imageDims = await getImageDimensions(base_image)
    console.log("[Inpaint] Image dimensions:", imageDims.width, "x", imageDims.height)
    
    const resizedMask = await resizeMaskToMatchImage(mask_image, imageDims.width, imageDims.height)
    console.log("[Inpaint] Mask resized to match image")

    // Build the inpainting prompt
    // Enhance prompt with quality keywords - do NOT add hardcoded content descriptions
    const enhancedPrompt = `${prompt}. High quality, detailed, professional, seamless blend, matching style and lighting. Use the reference element image faithfully: colors, textures, and structure must match it exactly. Preserve all layers and structural elements from the reference image.`

    // FLUX.1 Fill Pro model on Replicate
    // Model: black-forest-labs/flux-fill-pro
    const replicatePayload = {
      version: "flux-fill-pro", // Use the model name directly for official models
      input: {
        image: base_image,
        mask: resizedMask,
        prompt: enhancedPrompt,
        guidance: options.guidance_scale || 30,
        steps: options.steps || 50,
        output_format: "png",
        safety_tolerance: 2,
        prompt_upsampling: true,
        // Non-standard but helpful: include the reference image so the model has direct visual guidance.
        // If the model ignores it, the prompt above still nudges behavior.
        ...(reference_image ? { reference_image } : {}),
      },
    }

    console.log("[Inpaint] Calling Replicate API with FLUX Fill Pro...")

    // For official models, use the models endpoint
    const createResponse = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-fill-pro/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateApiKey}`,
        "Content-Type": "application/json",
        "Prefer": "wait", // Try to get result in single request
      },
      body: JSON.stringify({
        input: replicatePayload.input,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error("[Inpaint] Replicate API error:", errorText)
      
      // If FLUX Fill Pro doesn't work, try fallback to flux-fill-dev
      console.log("[Inpaint] Trying fallback to flux-fill-dev...")
      return await tryFluxFillDev(base_image, resizedMask, enhancedPrompt, options, replicateApiKey, startTime, reference_image)
    }

    const prediction = await createResponse.json()
    console.log("[Inpaint] Prediction response:", JSON.stringify(prediction).substring(0, 500))

    // Check if we got the result directly (with "Prefer: wait" header)
    if (prediction.output) {
      const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      console.log("[Inpaint] Got direct output URL:", outputUrl?.substring(0, 100))
      
      const resultImage = await urlToBase64(outputUrl)
      const duration = Date.now() - startTime

      return NextResponse.json({
        result_image: resultImage,
        meta: {
          model: "flux-fill-pro",
          duration_ms: duration,
        },
      })
    }

    // Otherwise poll for the result
    console.log("[Inpaint] Prediction created:", prediction.id)
    const result = await pollReplicatePrediction(
      prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
      replicateApiKey,
      120,
      2000
    )

    if (result.status !== "succeeded" || !result.output) {
      console.error("[Inpaint] Prediction failed:", result.error)
      return NextResponse.json(
        { error: result.error || "Inpainting failed" },
        { status: 500 }
      )
    }

    // Get the output image URL
    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output
    console.log("[Inpaint] Got output URL:", outputUrl?.substring(0, 100))

    // Convert the output URL to base64
    const resultImage = await urlToBase64(outputUrl)
    console.log("[Inpaint] Converted to base64, length:", resultImage.length)

    const duration = Date.now() - startTime

    return NextResponse.json({
      result_image: resultImage,
      meta: {
        model: "flux-fill-pro",
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("[Inpaint] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process inpainting request" },
      { status: 500 }
    )
  }
}

// Fallback to flux-fill-dev if pro version fails
async function tryFluxFillDev(
  base_image: string,
  mask_image: string,
  prompt: string,
  options: { guidance_scale?: number; steps?: number },
  apiKey: string,
  startTime: number,
  reference_image?: string
): Promise<NextResponse<InpaintResponse | { error: string }>> {
  console.log("[Inpaint] Using FLUX Fill Dev as fallback...")

  const createResponse = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-fill-dev/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Prefer": "wait",
    },
    body: JSON.stringify({
      input: {
        image: base_image,
        mask: mask_image,
        prompt: prompt,
        guidance: options.guidance_scale || 30,
        steps: options.steps || 50,
        output_format: "png",
        ...(reference_image ? { reference_image } : {}),
      },
    }),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    console.error("[Inpaint] Flux Fill Dev API error:", errorText)
    return NextResponse.json(
      { error: `Replicate API error: ${createResponse.status} - ${errorText}` },
      { status: createResponse.status }
    )
  }

  const prediction = await createResponse.json()
  console.log("[Inpaint] Dev prediction response:", JSON.stringify(prediction).substring(0, 500))

  // Check if we got the result directly
  if (prediction.output) {
    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
    const resultImage = await urlToBase64(outputUrl)
    const duration = Date.now() - startTime

    return NextResponse.json({
      result_image: resultImage,
      meta: {
        model: "flux-fill-dev",
        duration_ms: duration,
      },
    })
  }

  // Poll for result
  const result = await pollReplicatePrediction(
    prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
    apiKey,
    120,
    2000
  )

  if (result.status !== "succeeded" || !result.output) {
    return NextResponse.json(
      { error: result.error || "Inpainting failed" },
      { status: 500 }
    )
  }

  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output
  const resultImage = await urlToBase64(outputUrl)
  const duration = Date.now() - startTime

  return NextResponse.json({
    result_image: resultImage,
    meta: {
      model: "flux-fill-dev",
      duration_ms: duration,
    },
  })
}

// Mock function for development/testing
function mockInpaintResult(base_image: string, startTime: number): NextResponse<InpaintResponse> {
  const duration = Date.now() - startTime + 2000

  return NextResponse.json({
    result_image: base_image,
    meta: {
      model: "mock-inpainting",
      duration_ms: duration,
    },
  })
}
