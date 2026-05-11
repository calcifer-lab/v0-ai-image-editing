import { NextRequest, NextResponse } from "next/server"
import {
  callGoogleGenerate,
  extractGoogleImage,
  extractGoogleText,
  summarizeGoogleResponse,
  GOOGLE_IMAGE_MODEL,
  type OpenRouterContentPart,
} from "@/lib/api"
import { logStageEvent, newRequestId } from "@/lib/observability/log-stage"

/**
 * Normalize a data URI to always use PNG format.
 * Gemini sometimes returns data:image/jfif;base64,... which browsers
 * may save as .jfif — convert everything to data:image/png;base64,...
 */
function normalizeDataUri(uri: string): string {
  if (!uri.startsWith("data:")) return uri
  const base64Match = uri.match(/^data:[^;]+;base64,(.+)$/i)
  if (!base64Match) return uri
  return `data:image/png;base64,${base64Match[1]}`
}

export const runtime = "nodejs"
export const maxDuration = 300

interface FusionRequest {
  composite_image: string // 合成后的图片（base64）
  original_base: string // 原始背景图（base64）
  reference_image?: string // 裁剪后的参考元素（可选）
  mask_region: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface FusionResponse {
  fused_image: string
  meta: {
    model: string
    duration_ms: number
  }
}

/**
 * AI Fusion API - 使用 AI 融合合成后的图片，使新元素与背景自然一致
 *
 * 这个 API 接收一个已经合成的图片，然后使用 AI 模型进行以下操作：
 * 1. 分析整个场景的光影、风格、结构
 * 2. 融合新贴入的元素，使其与周围自然一致
 * 3. 保持角色（如果存在）的整体性、面部、发型、姿势
 * 4. 输出高质量、风格统一的最终图像
 */
export async function POST(request: NextRequest): Promise<NextResponse<FusionResponse | { error: string }>> {
  const startTime = Date.now()
  const requestId = newRequestId()

  try {
    const body: FusionRequest = await request.json()
    const { composite_image, original_base, reference_image, mask_region } = body

    if (!composite_image || !original_base) {
      return NextResponse.json({ error: "composite_image and original_base are required" }, { status: 400 })
    }

    logStageEvent("info", {
      requestId,
      stage: "fusion",
      mode: "composite",
      input_meta: { width: mask_region?.width, height: mask_region?.height },
      message: "fusion request received",
    })
    console.log("[Fusion] Starting AI fusion post-processing...")
    console.log("[Fusion] Mask region:", mask_region)

    const fusionPrompt = buildFusionPrompt(mask_region)
    const fusionContent = buildFusionContent(composite_image, original_base, reference_image, fusionPrompt)
    const failures: string[] = []

    // 1. Google AI Studio direct
    const googleApiKey = process.env.GOOGLE_API_KEY
    if (googleApiKey) {
      try {
        console.log("[Fusion] Using Google AI Studio (gemini-2.5-flash-image)...")
        const result = await fusionWithGoogle(fusionContent, googleApiKey, startTime)
        if (result) {
          logStageEvent("info", { requestId, stage: "fusion", provider: "google", model: GOOGLE_IMAGE_MODEL, elapsed_ms: Date.now() - startTime })
          return result
        }
        failures.push("Google: no image in response")
        logStageEvent("warn", { requestId, stage: "fusion", provider: "google", error_code: "NO_IMAGE_IN_RESPONSE", fallback_from: "google", fallback_to: "passthrough" })
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Google call threw"
        failures.push(`Google: ${msg}`)
        logStageEvent("warn", { requestId, stage: "fusion", provider: "google", error_code: "GOOGLE_CALL_THROW", fallback_from: "google", fallback_to: "passthrough", message: msg })
        console.warn("[Fusion] Google fusion failed:", error)
      }
    }

    // OpenRouter Gemini path retired — proxy account no longer serves OpenAI/Google models.
    // No FLUX img2img fallback implemented; degrade to passthrough below.

    // 2. Graceful degradation: return the composite as-is so the client always gets a usable
    //    image when Google fusion is unavailable.
    const reason = failures.length > 0 ? failures.join("; ") : "no provider configured"
    logStageEvent("warn", {
      requestId,
      stage: "fusion",
      error_code: "ALL_PROVIDERS_FAILED_PASSTHROUGH",
      elapsed_ms: Date.now() - startTime,
      message: `Fusion unavailable (${reason}), returning composite unchanged`,
    })
    console.warn("[Fusion] All providers failed — returning composite unchanged:", reason)
    return NextResponse.json({
      fused_image: composite_image,
      meta: { model: "passthrough", duration_ms: Date.now() - startTime },
    })
  } catch (error) {
    logStageEvent("error", {
      requestId,
      stage: "fusion",
      error_code: "UNHANDLED_EXCEPTION",
      elapsed_ms: Date.now() - startTime,
      message: error instanceof Error ? error.message : "unknown",
    })
    console.error("[Fusion] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process fusion request" },
      { status: 500 }
    )
  }
}


/**
 * 构建融合提示词
 */
function buildFusionPrompt(maskRegion: { x: number; y: number; width: number; height: number }): string {
  return `You are an image edge-blending specialist. The COMPOSITED IMAGE contains a newly pasted element at coordinates ${maskRegion.x},${maskRegion.y} (size ${maskRegion.width}x${maskRegion.height}).

YOUR ONLY TASK: blend the pasted element's outer edges into the surrounding scene. Do NOT repaint. Do NOT reframe. Do NOT change the element's identity, shape, position, scale, or pose.

ALLOWED operations (within 20px of the element's boundary only):
- Soft feather the cut edge so it doesn't look pasted
- Add a contact shadow consistent with the scene's light direction
- Match the element's edge colour temperature to the surroundings

FORBIDDEN operations (zero tolerance):
- Generating a new element from scratch
- Repainting the element with a different style
- Moving, scaling, rotating, or reframing the element
- Modifying any pixels >20px from the mask boundary
- Adding extra copies of the element anywhere
- Changing the camera angle or composition

The COMPOSITED IMAGE is the ground truth. Your output must look IDENTICAL to the COMPOSITED IMAGE except for the soft edge blending described above. If you would output any pixel that is not within 20px of the mask edge AND not byte-equal to the composited image, STOP and output the composited image unchanged.

OUTPUT: an image identical to the COMPOSITED IMAGE except with naturally blended edges around the pasted element.`
}

/**
 * 构建融合的多模态 content 数组（OpenRouter 格式，可被 google-ai 适配器转换为 Google 格式）
 */
function buildFusionContent(
  composite_image: string,
  original_base: string,
  reference_image: string | undefined,
  prompt: string
): OpenRouterContentPart[] {
  const systemPrompt = `You are an expert image fusion and harmonization AI. Your task is to take a composited image and make the newly added elements look naturally integrated with the scene through lighting adjustments, shadow generation, color matching, and edge blending.`

  const content: OpenRouterContentPart[] = [
    { type: "text", text: systemPrompt },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🧱 ORIGINAL BASE IMAGE (must remain unchanged outside the patched area):" },
    { type: "text", text: "Use this as the fidelity anchor for the surrounding scene. Preserve its composition, characters, and environment everywhere except the patched region." },
    { type: "image_url", image_url: { url: original_base } },
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🎨 COMPOSITED IMAGE (needs fusion):" },
    { type: "text", text: "This image contains a newly composited element that needs to be seamlessly fused with the background." },
    { type: "image_url", image_url: { url: composite_image } },
  ]

  if (reference_image) {
    content.push(
      { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
      { type: "text", text: "🧩 REFERENCE ELEMENT (already cropped to the intended patch):" },
      { type: "image_url", image_url: { url: reference_image } }
    )
  }

  content.push(
    { type: "text", text: "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "text", text: "🎯 FUSION TASK:" },
    { type: "text", text: prompt }
  )

  return content
}

/**
 * 通过 Google AI Studio 直连调用 Gemini 进行融合
 */
async function fusionWithGoogle(
  content: OpenRouterContentPart[],
  apiKey: string,
  startTime: number
): Promise<NextResponse<FusionResponse> | null> {
  // Slightly higher temperature than inpaint — fusion's job is "harmonize",
  // a bit more variability is acceptable since geometry is already pinned by
  // the input composite.
  const result = await callGoogleGenerate(GOOGLE_IMAGE_MODEL, content, apiKey, {
    responseModalities: ["TEXT", "IMAGE"],
    temperature: 0.6,
  })

  if (!result.ok) {
    console.error("[Fusion] Google API error:", result.status, result.error)
    return null
  }

  const image = extractGoogleImage(result.data)
  if (!image) {
    const text = extractGoogleText(result.data)
    const finishReason = (result.data as any)?.candidates?.[0]?.finishReason
    const promptFeedback = JSON.stringify((result.data as any)?.promptFeedback ?? {})
    const rawSummary = summarizeGoogleResponse(result.data)
    console.error(
      "[Fusion] Google returned 200 but no image. " +
        `finishReason=${finishReason ?? "<none>"}, ` +
        `promptFeedback=${promptFeedback}, ` +
        `text=${(text || "<empty>").slice(0, 400)}`
    )
    console.error("[Fusion] Google raw response (redacted):", rawSummary)
    return null
  }

  console.log("[Fusion] Successfully fused image with Google direct API")
  return NextResponse.json({
    fused_image: normalizeDataUri(image),
    meta: { model: "google-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
  })
}

