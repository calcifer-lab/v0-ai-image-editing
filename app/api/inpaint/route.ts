import { NextRequest, NextResponse } from "next/server"
import type { InpaintRequest, InpaintResponse, ApiErrorResponse } from "@/types"
import {
  pollReplicatePrediction,
  urlToBase64,
  isValidImage,
  getImageDimensions,
  resizeMaskToMatchImage,
  extractOutputUrl,
} from "@/lib/api"
import { buildGeminiInpaintPrompt, buildFluxEnhancedPrompt } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 300 // 5 minutes for model processing

// ============ Gemini 图像生成 ============
async function tryGeminiImageGeneration(
  base_image: string,
  mask_image: string,
  reference_image: string,
  prompt: string,
  apiKey: string,
  startTime: number
): Promise<NextResponse<InpaintResponse | ApiErrorResponse> | null> {
  console.log("[Inpaint] Using Gemini 2.5 Flash Image (google/gemini-2.5-flash-image)...")
  console.log("[Inpaint] Prompt:", prompt)

  const systemPrompt = buildGeminiInpaintPrompt(prompt)
  
  const content = [
    { type: "text", text: systemPrompt },
    { type: "text", text: "⬇️ REFERENCE IMAGE - STUDY THIS CAREFULLY! Copy the EXACT elements you see here:" },
    { type: "image_url", image_url: { url: reference_image } },
    { type: "text", text: "⬇️ TARGET IMAGE (the image to edit):" },
    { type: "image_url", image_url: { url: base_image } },
    { type: "text", text: "⬇️ MASK IMAGE (white area = where to paste the content from REFERENCE IMAGE):" },
    { type: "image_url", image_url: { url: mask_image } },
  ]

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Inpaint] Gemini API error:", errorText)
    // 返回 null 让调用者回退到 FLUX
    return null
  }

  const data = await response.json()
  console.log("[Inpaint] Gemini response received")

  // 提取生成的图片
  const message = data.choices?.[0]?.message
  
  // 检查 message.images 数组（OpenRouter Gemini 图像生成格式）
  if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
    const imageData = message.images[0]
    let resultImage: string
    
    if (typeof imageData === "string") {
      resultImage = imageData.startsWith("data:") ? imageData : `data:image/png;base64,${imageData}`
    } else if (imageData?.image_url?.url) {
      resultImage = imageData.image_url.url
    } else if (imageData?.b64_json) {
      resultImage = `data:image/png;base64,${imageData.b64_json}`
    } else {
      console.error("[Inpaint] Unexpected image format in message.images:", imageData)
      return null
    }

    console.log("[Inpaint] Successfully got image from Gemini message.images")
    return NextResponse.json({
      result_image: resultImage,
      meta: { model: "gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
    })
  }

  // 检查 content 中的 inline_data（另一种可能的格式）
  const contentArray = message?.content
  if (Array.isArray(contentArray)) {
    for (const part of contentArray) {
      if (part.type === "image" && part.image?.base64) {
        const resultImage = `data:image/png;base64,${part.image.base64}`
        console.log("[Inpaint] Successfully got image from Gemini content array")
        return NextResponse.json({
          result_image: resultImage,
          meta: { model: "gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
        })
      }
    }
  }

  // 检查 content 字符串中的 base64 图片
  const contentText = typeof message?.content === "string" ? message.content : ""
  const base64Match = contentText.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
  if (base64Match) {
    console.log("[Inpaint] Successfully extracted base64 image from Gemini content text")
    return NextResponse.json({
      result_image: base64Match[0],
      meta: { model: "gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
    })
  }

  console.error("[Inpaint] No image found in Gemini response:", JSON.stringify(data).substring(0, 1000))
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

// ============ Mock 函数（开发测试用） ============
function mockInpaintResult(base_image: string, startTime: number): NextResponse<InpaintResponse> {
  return NextResponse.json({
    result_image: base_image,
    meta: { model: "mock-inpainting", duration_ms: Date.now() - startTime + 2000 },
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

    if (!isValidImage(base_image) || !isValidImage(mask_image)) {
      return NextResponse.json(
        { error: "Invalid image format. Must be base64 encoded image." },
        { status: 400 }
      )
    }

    console.log("[Inpaint] Has reference image:", !!reference_image)
    console.log("[Inpaint] Prompt:", prompt)

    // 优先使用 Gemini（如果有参考图片且配置了 OpenRouter API key）
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (reference_image && openRouterApiKey) {
      console.log("[Inpaint] Trying Gemini for reference-guided inpainting...")
      try {
        const geminiResult = await tryGeminiImageGeneration(
          base_image,
          mask_image,
          reference_image,
          prompt,
          openRouterApiKey,
          startTime
        )
        if (geminiResult) {
          return geminiResult
        }
        console.log("[Inpaint] Gemini returned null, falling back to FLUX...")
      } catch (geminiError) {
        console.error("[Inpaint] Gemini error, falling back to FLUX:", geminiError)
      }
    }

    // 使用 Replicate FLUX 作为后备
    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (!replicateApiKey) {
      console.warn("[Inpaint] REPLICATE_API_KEY not configured. Returning mock result.")
      return mockInpaintResult(base_image, startTime)
    }

    return tryFluxFillPro(base_image, mask_image, prompt, options, replicateApiKey, startTime, reference_image)
  } catch (error) {
    console.error("[Inpaint] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process inpainting request" },
      { status: 500 }
    )
  }
}
