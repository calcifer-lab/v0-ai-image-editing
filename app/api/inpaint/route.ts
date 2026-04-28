import { NextRequest, NextResponse } from "next/server"
import type { InpaintRequest, InpaintResponse, ApiErrorResponse } from "@/types"
import {
  pollReplicatePrediction,
  urlToBase64,
  isValidImage,
  getImageDimensions,
  resizeMaskToMatchImage,
  extractOutputUrl,
  validateImageDataUrl,
} from "@/lib/api"
import {
  buildGeminiInpaintPrompt,
  buildFluxEnhancedPrompt,
  openRouterHeaders,
  callGoogleGenerate,
  extractGoogleImage,
  GOOGLE_IMAGE_MODEL,
  type OpenRouterContentPart,
} from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes for model processing
const MAX_INPAINT_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_INPAINT_REFERENCE_BYTES = 8 * 1024 * 1024

/** Normalize any data URI to always use PNG MIME type, preventing .jfif saves */
function normalizeDataUri(uri: string): string {
  if (!uri.startsWith("data:")) return uri
  const base64Match = uri.match(/^data:[^;]+;base64,(.+)$/i)
  if (!base64Match) return uri
  return `data:image/png;base64,${base64Match[1]}`
}

// ============ Gemini 图像生成 ============

interface InpaintInputs {
  base_image: string
  reference_image: string
  alignedMask: string
  prompt: string
}

async function prepareInpaintInputs(
  base_image: string,
  mask_image: string,
  reference_image: string,
  prompt: string
): Promise<InpaintInputs> {
  const baseDims = await getImageDimensions(base_image)
  const alignedMask = await resizeMaskToMatchImage(mask_image, baseDims.width, baseDims.height)
  return { base_image, reference_image, alignedMask, prompt }
}

function buildInpaintContent(inputs: InpaintInputs): OpenRouterContentPart[] {
  const systemPrompt = buildGeminiInpaintPrompt(inputs.prompt)
  return [
    { type: "text", text: systemPrompt },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "📥 IMAGE 1: REFERENCE/SOURCE (NEW CONTENT TO INSERT)" },
    { type: "text", text: "This contains the NEW elements that must REPLACE the masked region in Image 2. Study every detail - colors, textures, layers, structure. These MUST appear in your final output." },
    { type: "image_url", image_url: { url: inputs.reference_image } },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🎨 IMAGE 2: TARGET/BASE (CANVAS TO MODIFY)" },
    { type: "text", text: "This is the background that will be MODIFIED. The masked region in this image will be DELETED and REPLACED with Image 1's content. Do NOT preserve Image 2's content in the masked area." },
    { type: "image_url", image_url: { url: inputs.base_image } },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "⬜ IMAGE 3: MASK (DELETION/INSERTION ZONE)" },
    { type: "text", text: "White pixels = DELETE Image 2's content here and INSERT Image 1's content instead. Black pixels = keep Image 2's original content unchanged." },
    { type: "image_url", image_url: { url: inputs.alignedMask } },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🎯 FINAL COMMAND - READ CAREFULLY:" },
    { type: "text", text: "Generate a NEW image where:\n✓ BLACK masked area = Keep Image 2's original content\n✓ WHITE masked area = COMPLETELY REPLACE with Image 1's content (NOT Image 2's!)\n\n⚠️ The white-masked region MUST look DIFFERENT from Image 2's original.\n⚠️ The white-masked region MUST show Image 1's elements CLEARLY.\n⚠️ This is INPAINTING (replacement), NOT blending or harmonization.\n\nSTART GENERATING NOW." },
  ]
}

async function inpaintWithGoogle(
  content: OpenRouterContentPart[],
  apiKey: string,
  startTime: number
): Promise<NextResponse<InpaintResponse | ApiErrorResponse> | null> {
  const result = await callGoogleGenerate(GOOGLE_IMAGE_MODEL, content, apiKey, {
    responseModalities: ["TEXT", "IMAGE"],
  })

  if (!result.ok) {
    console.error("[Inpaint] Google API error:", result.status, result.error)
    return null
  }

  const image = extractGoogleImage(result.data)
  if (!image) {
    console.error("[Inpaint] No image found in Google response")
    return null
  }

  console.log("[Inpaint] Successfully generated image via Google direct API")
  return NextResponse.json({
    result_image: normalizeDataUri(image),
    meta: { model: "google-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
  })
}

async function inpaintWithOpenRouter(
  content: OpenRouterContentPart[],
  apiKey: string,
  startTime: number
): Promise<NextResponse<InpaintResponse | ApiErrorResponse> | null> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Inpaint] OpenRouter Gemini API error:", errorText)
    return null
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message

  if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
    const imageData = message.images[0]
    let resultImage: string

    if (typeof imageData === "string") {
      resultImage = imageData.startsWith("data:") ? normalizeDataUri(imageData) : `data:image/png;base64,${imageData}`
    } else if (imageData?.image_url?.url) {
      resultImage = normalizeDataUri(imageData.image_url.url)
    } else if (imageData?.b64_json) {
      resultImage = `data:image/png;base64,${imageData.b64_json}`
    } else {
      console.error("[Inpaint] Unexpected image format in message.images:", imageData)
      return null
    }

    console.log("[Inpaint] Successfully got image from OpenRouter message.images")
    return NextResponse.json({
      result_image: resultImage,
      meta: { model: "openrouter-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
    })
  }

  const contentArray = message?.content
  if (Array.isArray(contentArray)) {
    for (const part of contentArray) {
      if (part.type === "image" && part.image?.base64) {
        const resultImage = `data:image/png;base64,${part.image.base64}`
        console.log("[Inpaint] Successfully got image from OpenRouter content array")
        return NextResponse.json({
          result_image: resultImage,
          meta: { model: "openrouter-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
        })
      }
    }
  }

  const contentText = typeof message?.content === "string" ? message.content : ""
  const base64Match = contentText.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
  if (base64Match) {
    console.log("[Inpaint] Successfully extracted base64 image from OpenRouter content text")
    return NextResponse.json({
      result_image: normalizeDataUri(base64Match[0]),
      meta: { model: "openrouter-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
    })
  }

  console.error("[Inpaint] No image found in OpenRouter response:", JSON.stringify(data).substring(0, 1000))
  return null
}

// ============ FLUX Fill Pro ============
async function tryFluxFillPro(
  base_image: string,
  mask_image: string,
  prompt: string,
  options: { guidance_scale?: number; steps?: number },
  apiKey: string,
  startTime: number,
  reference_image?: string
): Promise<NextResponse<InpaintResponse | ApiErrorResponse>> {
  console.log("[Inpaint] Using FLUX.1 Fill Pro for inpainting...")

  const imageDims = await getImageDimensions(base_image)
  console.log("[Inpaint] Image dimensions:", imageDims.width, "x", imageDims.height)
  
  const resizedMask = await resizeMaskToMatchImage(mask_image, imageDims.width, imageDims.height)
  const enhancedPrompt = buildFluxEnhancedPrompt(prompt)

  const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-fill-pro/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        image: base_image,
        mask: resizedMask,
        prompt: enhancedPrompt,
        guidance: options.guidance_scale || 30,
        steps: options.steps || 50,
        output_format: "png",
        safety_tolerance: 2,
        prompt_upsampling: true,
        ...(reference_image ? { reference_image } : {}),
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Inpaint] Replicate API error:", errorText)
    // 尝试降级到 flux-fill-dev
    return tryFluxFillDev(base_image, resizedMask, enhancedPrompt, options, apiKey, startTime, reference_image)
  }

  const prediction = await response.json()
  console.log("[Inpaint] Prediction response:", JSON.stringify(prediction).substring(0, 500))

  // 检查是否直接返回了结果
  if (prediction.output) {
    const outputUrl = extractOutputUrl(prediction.output)
    if (outputUrl) {
      const resultImage = await urlToBase64(outputUrl)
      return NextResponse.json({
        result_image: resultImage,
        meta: { model: "flux-fill-pro", duration_ms: Date.now() - startTime },
      })
    }
  }

  // 轮询获取结果
  console.log("[Inpaint] Prediction created:", prediction.id)
  const result = await pollReplicatePrediction(
    prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
    apiKey,
    120,
    2000
  )

  if (result.status !== "succeeded" || !result.output) {
    console.error("[Inpaint] Prediction failed:", result.error)
    return NextResponse.json({ error: result.error || "Inpainting failed" }, { status: 500 })
  }

  const outputUrl = extractOutputUrl(result.output)
  if (!outputUrl) {
    return NextResponse.json({ error: "No output URL in prediction result" }, { status: 500 })
  }

  const resultImage = await urlToBase64(outputUrl)
  return NextResponse.json({
    result_image: resultImage,
    meta: { model: "flux-fill-pro", duration_ms: Date.now() - startTime },
  })
}

// ============ FLUX Fill Dev (降级) ============
async function tryFluxFillDev(
  base_image: string,
  mask_image: string,
  prompt: string,
  options: { guidance_scale?: number; steps?: number },
  apiKey: string,
  startTime: number,
  reference_image?: string
): Promise<NextResponse<InpaintResponse | ApiErrorResponse>> {
  console.log("[Inpaint] Using FLUX Fill Dev as fallback...")

  const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-fill-dev/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        image: base_image,
        mask: mask_image,
        prompt,
        guidance: options.guidance_scale || 30,
        steps: options.steps || 50,
        output_format: "png",
        ...(reference_image ? { reference_image } : {}),
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Inpaint] Flux Fill Dev API error:", errorText)
    return NextResponse.json(
      { error: `Replicate API error: ${response.status} - ${errorText}` },
      { status: response.status }
    )
  }

  const prediction = await response.json()
  console.log("[Inpaint] Dev prediction response:", JSON.stringify(prediction).substring(0, 500))

  if (prediction.output) {
    const outputUrl = extractOutputUrl(prediction.output)
    if (outputUrl) {
      const resultImage = await urlToBase64(outputUrl)
      return NextResponse.json({
        result_image: resultImage,
        meta: { model: "flux-fill-dev", duration_ms: Date.now() - startTime },
      })
    }
  }

  // 轮询获取结果
  const result = await pollReplicatePrediction(
    prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`,
    apiKey,
    120,
    2000
  )

  if (result.status !== "succeeded" || !result.output) {
    return NextResponse.json({ error: result.error || "Inpainting failed" }, { status: 500 })
  }

  const outputUrl = extractOutputUrl(result.output)
  if (!outputUrl) {
    return NextResponse.json({ error: "No output URL in prediction result" }, { status: 500 })
  }

  const resultImage = await urlToBase64(outputUrl)
  return NextResponse.json({
    result_image: resultImage,
    meta: { model: "flux-fill-dev", duration_ms: Date.now() - startTime },
  })
}

// ============ 主路由处理 ============
export async function POST(request: NextRequest): Promise<NextResponse<InpaintResponse | ApiErrorResponse>> {
  const startTime = Date.now()

  try {
    const body: InpaintRequest = await request.json()
    const { base_image, mask_image, reference_image, prompt, options = {} } = body

    // 验证输入
    if (!base_image || !mask_image || !prompt) {
      return NextResponse.json(
        { error: "base_image, mask_image, and prompt are required" },
        { status: 400 }
      )
    }

    const validatedBase = validateImageDataUrl(base_image, {
      fieldName: "base_image",
      maxBytes: MAX_INPAINT_IMAGE_BYTES,
    })
    if (!validatedBase.ok) {
      return NextResponse.json({ error: validatedBase.error }, { status: validatedBase.status })
    }

    const validatedMask = validateImageDataUrl(mask_image, {
      fieldName: "mask_image",
      maxBytes: MAX_INPAINT_IMAGE_BYTES,
    })
    if (!validatedMask.ok) {
      return NextResponse.json({ error: validatedMask.error }, { status: validatedMask.status })
    }

    let validatedReference: string | undefined
    if (reference_image) {
      const referenceCheck = validateImageDataUrl(reference_image, {
        fieldName: "reference_image",
        maxBytes: MAX_INPAINT_REFERENCE_BYTES,
      })
      if (!referenceCheck.ok) {
        return NextResponse.json({ error: referenceCheck.error }, { status: referenceCheck.status })
      }
      validatedReference = referenceCheck.image.dataUrl
    }

    console.log("[Inpaint] Has reference image:", !!validatedReference)
    console.log("[Inpaint] Reference image preview:", validatedReference ? validatedReference.substring(0, 50) + "..." : "null")
    console.log("[Inpaint] Prompt:", prompt)
    console.log("[Inpaint] Options:", JSON.stringify(options))

    const failures: string[] = []

    // Reference-guided Gemini path: Google direct → OpenRouter
    if (validatedReference) {
      const inputs = await prepareInpaintInputs(
        validatedBase.image.dataUrl,
        validatedMask.image.dataUrl,
        validatedReference,
        prompt
      )
      const content = buildInpaintContent(inputs)

      // 1. Google AI Studio direct
      const googleApiKey = process.env.GOOGLE_API_KEY
      if (googleApiKey) {
        console.log("[Inpaint] Trying Google AI Studio direct (gemini-2.5-flash-image-preview)...")
        try {
          const result = await inpaintWithGoogle(content, googleApiKey, startTime)
          if (result) return result
          failures.push("Google: no image in response")
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Google call threw"
          failures.push(`Google: ${msg}`)
          console.error("[Inpaint] Google direct error:", error)
        }
      }

      // 2. OpenRouter
      const openRouterApiKey = process.env.OPENROUTER_API_KEY
      if (openRouterApiKey) {
        console.log("[Inpaint] Trying OpenRouter Gemini for reference-guided inpainting...")
        try {
          const result = await inpaintWithOpenRouter(content, openRouterApiKey, startTime)
          if (result) return result
          failures.push("OpenRouter: no image in response")
        } catch (error) {
          const msg = error instanceof Error ? error.message : "OpenRouter call threw"
          failures.push(`OpenRouter: ${msg}`)
          console.error("[Inpaint] OpenRouter error:", error)
        }
      }
    }

    // 3. Replicate FLUX
    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (!replicateApiKey) {
      const reason = failures.length > 0
        ? `AI inpainting failed (${failures.join("; ")}) and no Replicate fallback is configured`
        : "No AI inpainting providers are configured"
      console.warn("[Inpaint] " + reason)
      return NextResponse.json({ error: reason }, { status: 502 })
    }

    return tryFluxFillPro(
      validatedBase.image.dataUrl,
      validatedMask.image.dataUrl,
      prompt,
      options,
      replicateApiKey,
      startTime,
      validatedReference
    )
  } catch (error) {
    console.error("[Inpaint] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process inpainting request" },
      { status: 500 }
    )
  }
}
