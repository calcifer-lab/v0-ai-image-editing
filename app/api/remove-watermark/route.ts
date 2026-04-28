import { NextRequest, NextResponse } from "next/server"
import { openRouterHeaders } from "@/lib/api"

export const runtime = "nodejs"
export const maxDuration = 60

interface RemoveWatermarkRequest {
  image: string // base64 encoded image
  watermark_location?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "auto"
}

interface RemoveWatermarkResponse {
  result_image: string
  meta: {
    model: string
    duration_ms: number
  }
}

/**
 * 水印去除 API
 * 使用 AI 模型智能去除图片中的水印
 */
export async function POST(request: NextRequest): Promise<NextResponse<RemoveWatermarkResponse | { error: string }>> {
  const startTime = Date.now()

  try {
    const body: RemoveWatermarkRequest = await request.json()
    const { image, watermark_location = "auto" } = body

    if (!image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 })
    }

    console.log("[RemoveWatermark] Starting watermark removal...")
    console.log("[RemoveWatermark] Watermark location:", watermark_location)

    // 优先使用 Gemini Flash 进行水印去除（快速、效果好）
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (openRouterApiKey) {
      try {
        console.log("[RemoveWatermark] Using Gemini for watermark removal...")
        const geminiResult = await removeWatermarkWithGemini(image, watermark_location, openRouterApiKey, startTime)
        if (geminiResult) {
          return geminiResult
        }
      } catch (error) {
        console.warn("[RemoveWatermark] Gemini failed, trying alternatives:", error)
      }
    }

    // 后备方案：使用 Replicate LaMa 或其他修复模型
    const replicateApiKey = process.env.REPLICATE_API_KEY
    if (replicateApiKey) {
      try {
        console.log("[RemoveWatermark] Using Replicate inpainting for watermark removal...")
        return await removeWatermarkWithReplicate(image, watermark_location, replicateApiKey, startTime)
      } catch (error) {
        console.warn("[RemoveWatermark] Replicate failed:", error)
      }
    }

    // 如果所有方法都失败，返回原图
    console.warn("[RemoveWatermark] No watermark removal API available, returning original image")
    return NextResponse.json({
      result_image: image,
      meta: { model: "no-removal", duration_ms: Date.now() - startTime },
    })
  } catch (error) {
    console.error("[RemoveWatermark] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove watermark" },
      { status: 500 }
    )
  }
}

/**
 * 使用 Gemini 去除水印
 */
async function removeWatermarkWithGemini(
  image: string,
  location: string,
  apiKey: string,
  startTime: number
): Promise<NextResponse<RemoveWatermarkResponse> | null> {
  const locationHint = getLocationHint(location)

  const prompt = `You are an expert image restoration specialist. This image contains a watermark that needs to be removed.

TASK: Remove the watermark from this image while preserving all other content

WATERMARK LOCATION: ${locationHint}

🔍 WATERMARK TYPES TO DETECT AND REMOVE:
✓ Text watermarks in ANY language (English, Chinese/中文, Japanese, Korean, etc.)
✓ Common AI generator watermarks:
  - "豆包AI生成" / "豆包AI" (Doubao AI)
  - "AI生成" / "AI Generated"
  - "Midjourney" / "DALL-E" / "Stable Diffusion"
  - Any company/service name or logo
✓ Semi-transparent overlays
✓ Corner stamps or signatures
✓ URLs or website names
✓ Date/time stamps

CRITICAL - SCAN CAREFULLY:
⚠️ Look especially in image corners (top-left, top-right, bottom-left, bottom-right)
⚠️ Check for small text that may be partially transparent
⚠️ Chinese characters (汉字) like "生成", "AI", "豆包" are common in Chinese AI tools
⚠️ Do NOT miss any text - scan the ENTIRE image systematically

INSTRUCTIONS:
1. SCAN the entire image methodically - start from corners, then edges, then center
2. IDENTIFY all watermarks (text in any language, logos, stamps, overlays)
3. For each watermark found:
   a. Note its exact location and size
   b. Analyze surrounding texture, color, and pattern
   c. Intelligently remove it by inpainting the area naturally
   d. Match the surrounding texture perfectly
4. Ensure the removal is seamless and undetectable
5. Preserve ALL other content - characters, objects, background, etc.
6. Do NOT alter, move, or modify any part except watermarks

CRITICAL REQUIREMENTS:
✓ Remove ALL watermarks found (don't miss any!)
✓ Preserve character faces, expressions, poses exactly
✓ Preserve background details and textures
✓ Match colors and lighting of surrounding area
✓ Make the removal invisible and natural
✓ Special attention to Chinese text watermarks (common in Chinese AI tools)

✅ SUCCESS CHECK:
1. Did I scan all four corners? ✓
2. Did I check all edges? ✓
3. Did I find and remove ALL text (including Chinese)? ✓
4. Is the area perfectly blended with surroundings? ✓

OUTPUT: Generate the same image with ALL watermarks cleanly removed. The result should look like watermarks were never there.`

  const content = [
    { type: "text", text: prompt },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🖼️ IMAGE WITH WATERMARK:" },
    { type: "image_url", image_url: { url: image } },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🎯 TASK: Remove the watermark cleanly while preserving everything else. START NOW." },
  ]

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
    console.error("[RemoveWatermark] Gemini API error:", errorText)
    return null
  }

  const data = await response.json()
  console.log("[RemoveWatermark] Gemini response received")

  const message = data.choices?.[0]?.message

  // Extract image from response
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
      console.error("[RemoveWatermark] Unexpected image format")
      return null
    }

    console.log("[RemoveWatermark] Successfully removed watermark with Gemini")
    return NextResponse.json({
      result_image: resultImage,
      meta: { model: "gemini-watermark-removal", duration_ms: Date.now() - startTime },
    })
  }

  console.error("[RemoveWatermark] No image found in Gemini response")
  return null
}

/**
 * 使用 Replicate 去除水印（使用 LaMa 或类似的修复模型）
 */
async function removeWatermarkWithReplicate(
  image: string,
  location: string,
  apiKey: string,
  startTime: number
): Promise<NextResponse<RemoveWatermarkResponse | { error: string }>> {
  // TODO: 实现使用 Replicate LaMa 或其他修复模型
  // 这需要生成一个掩码来标记水印位置
  console.log("[RemoveWatermark] Replicate watermark removal not yet implemented")

  return NextResponse.json({
    result_image: image,
    meta: { model: "no-replicate-removal", duration_ms: Date.now() - startTime },
  })
}

/**
 * 根据位置参数生成位置提示
 */
function getLocationHint(location: string): string {
  switch (location) {
    case "bottom-right":
      return "The watermark is typically located in the BOTTOM-RIGHT corner of the image"
    case "bottom-left":
      return "The watermark is typically located in the BOTTOM-LEFT corner of the image"
    case "top-right":
      return "The watermark is typically located in the TOP-RIGHT corner of the image"
    case "top-left":
      return "The watermark is typically located in the TOP-LEFT corner of the image"
    case "auto":
    default:
      return "The watermark location is unknown - scan the entire image, commonly found in corners or edges"
  }
}
