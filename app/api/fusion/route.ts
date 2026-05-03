import { NextRequest, NextResponse } from "next/server"
import {
  callGoogleGenerate,
  extractGoogleImage,
  GOOGLE_IMAGE_MODEL,
  openRouterHeaders,
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

    // 1. Google AI Studio direct (preferred — bypasses OpenRouter content routing)
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
        logStageEvent("warn", { requestId, stage: "fusion", provider: "google", error_code: "NO_IMAGE_IN_RESPONSE", fallback_from: "google", fallback_to: "openrouter" })
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Google call threw"
        failures.push(`Google: ${msg}`)
        logStageEvent("warn", { requestId, stage: "fusion", provider: "google", error_code: "GOOGLE_CALL_THROW", fallback_from: "google", fallback_to: "openrouter", message: msg })
        console.warn("[Fusion] Google fusion failed:", error)
      }
    }

    // 2. OpenRouter (fallback)
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (openRouterApiKey) {
      try {
        console.log("[Fusion] Using OpenRouter Gemini 2.5 Flash for fusion...")
        const result = await fusionWithOpenRouter(fusionContent, openRouterApiKey, startTime)
        if (result) {
          logStageEvent("info", { requestId, stage: "fusion", provider: "openrouter", model: "google/gemini-2.5-flash-image", elapsed_ms: Date.now() - startTime })
          return result
        }
        failures.push("OpenRouter: no image in response")
        logStageEvent("warn", { requestId, stage: "fusion", provider: "openrouter", error_code: "NO_IMAGE_IN_RESPONSE", fallback_from: "openrouter", fallback_to: "flux" })
      } catch (error) {
        const msg = error instanceof Error ? error.message : "OpenRouter call threw"
        failures.push(`OpenRouter: ${msg}`)
        logStageEvent("warn", { requestId, stage: "fusion", provider: "openrouter", error_code: "OPENROUTER_CALL_THROW", fallback_from: "openrouter", fallback_to: "flux", message: msg })
        console.warn("[Fusion] OpenRouter fusion failed:", error)
      }
    }

    // 3. Graceful degradation: return the composite as-is so the client always gets a usable
    //    image. FLUX img2img fusion is not yet implemented; we log the failure and pass through.
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
  return `You are an expert image fusion specialist. This image contains a newly composited element that needs to be seamlessly integrated with the existing scene.

CRITICAL TASK: FUSION AND HARMONIZATION
- Analyze the entire image for lighting, shadows, color temperature, and style
- The composited region (around coordinates ${maskRegion.x},${maskRegion.y}, size ${maskRegion.width}x${maskRegion.height}) contains a newly added element
- Your goal is to FUSE this element naturally with the surrounding environment

⚠️ CONFLICT DETECTION AND REMOVAL (HIGHEST PRIORITY - CRITICAL):
Before any fusion work, METICULOUSLY scan for conflicts and duplicates:

🚨 HANDS AND ARMS DETECTION:
✓ Count ALL hands visible in the composited element
✓ Count ALL hands visible in the base image character
✓ If TOTAL hands > 2, you MUST DELETE the extra hands from the composited element
✓ ONLY the base image character's original hands should remain - DELETE all hands from the pasted element
✓ Look for: fingers, palms, wrists, forearms - DELETE any that belong to the pasted element

🚨 SPATIAL ALIGNMENT:
✓ If the element contains objects (tray, plate, tool), check if they align with the base character's hand position
✓ If misaligned: MOVE or TRANSFORM the object to align with the base character's hands
✓ The object should appear to be HELD by the base character's hands, not floating or misaligned
✓ Example: If base has hands at waist level, the tray should be at waist level, not chest level

🚨 DELETION RULES:
✓ DELETE: Any hands/arms that came from the source element image
✓ KEEP: Only the base image character's original hands and arms
✓ ADJUST: Object position/angle to match base character's hand position and pose
✓ Think: "Does this look like the character is actually holding this object naturally?"

⚠️ FAILURE CHECK: If you see more than 2 hands total, or objects not aligned with character's grasp, you have FAILED

🎯 TWO-PHASE FUSION STRATEGY (CRITICAL - FOLLOW BOTH PHASES):

📍 PHASE 1: INTERNAL LIGHTING & COLOR HARMONY (Preserve Shape, Adjust Light Only)
Before handling edges, harmonize the element's INTERNAL lighting and colors WITHOUT changing shapes:

⚠️ SHAPE PRESERVATION (HIGHEST PRIORITY):
✓ PRESERVE the EXACT shapes, sizes, and forms of ALL objects in the element
✓ Do NOT morph, distort, or change the geometry of any object (food, tray, rack, etc.)
✓ Do NOT merge objects together - keep them as distinct as they are
✓ Think: "Are the objects the SAME shape as in the composited version?" If NO, you FAILED

✓ ONLY ADJUST: Lighting, shadows, brightness, color temperature, and reflections
✓ If element contains multiple sub-components (e.g., tray + rack + food):
  - Keep their SHAPES unchanged
  - Adjust their lighting to be consistent with each other
  - Harmonize their color temperature
  - Add natural shadows between them
✓ Example: If pasting food on a tray, keep food shape EXACTLY as composited, only adjust its lighting/shadows
✓ Internal lighting harmony MUST be completed before moving to edge blending
✓ Think: "Did I preserve shapes while improving lighting?" If shapes changed, you FAILED

📍 PHASE 2: EDGE BLENDING WITH ENVIRONMENT (Element's Outer Boundaries)
After internal fusion is perfect, handle the element's edges with environment:
✓ Analyze surrounding environment's geometric features (straight lines, curves, angles, patterns)
✓ The element's OUTER edges MUST match the surrounding geometry:
  - If surroundings have STRAIGHT LINES (walls, panels, shelves), element edges should align with those lines
  - If surroundings have CURVES, element edges should follow similar curves
  - If surroundings have GRID PATTERNS, element should respect the grid alignment
✓ Blend OUTER edges with SOFT, GRADUAL transitions - NOT sharp boundaries
✓ Use feathering and gradient blending at ALL outer edges while maintaining geometric consistency
✓ The boundary should be INVISIBLE - viewer should NOT be able to tell where element ends and background begins
✓ Create natural falloff from element to background (fade the edges smoothly)
✓ Example: If element is pasted on a spaceship interior with straight metal panels, the element's outer edges should align with panel edges, NOT create curved boundaries that break the straight-line aesthetic
✓ Pay EXTRA attention to corners and edge transitions
✓ Do NOT leave distinct, sharp, or obvious boundaries at outer edges - this looks unnatural and artificial
✓ Think: "Do the element's outer edges respect the geometric structure of the environment AND fade naturally into it?"

⚠️ CRITICAL: You MUST complete BOTH phases. Do NOT skip internal fusion. Do NOT skip edge blending. Both are required for success.

STYLE CONSISTENCY (CRITICAL):
✓ MATCH the exact artistic style of the base image (photorealistic, cartoon, anime, painting, etc.)
✓ If base is photorealistic, make element photorealistic with same level of detail
✓ If base is cartoon/anime, stylize the element to match exactly
✓ Ensure color grading, contrast, saturation match the base image's aesthetic
✓ The element should look like it was ALWAYS part of this image - same artist, same style, same technique

LIGHTING AND SHADOW REQUIREMENTS:
✓ Match lighting direction and intensity from the environment
✓ Add realistic shadows that match the scene's light source
✓ Adjust color temperature to match ambient lighting
✓ Add appropriate ambient occlusion and contact shadows
✓ Preserve fine details (textures, patterns, materials)

CHARACTER PRESERVATION (if base image has characters):
✓ Maintain base image characters EXACTLY: face, hair, clothing, pose MUST remain identical
✓ Keep facial features unchanged (eyes, nose, mouth, expression)
✓ Preserve hairstyle and hair color exactly
✓ Maintain body proportions and posture
✓ Keep outfit details consistent
✓ If element brings conflicting body parts (extra hands, limbs), REMOVE them completely

STEP-BY-STEP PROCESS (FOLLOW EXACTLY):
1. COUNT HANDS: How many hands total do you see? If > 2, identify which hands came from pasted element and DELETE them completely
2. SPATIAL ALIGNMENT: Is the pasted object (tray/tool) aligned with base character's hand position? If NO, transform it to align
3. INTERNAL LIGHTING HARMONY (PHASE 1): Harmonize lighting WITHOUT changing shapes
   - Are ALL object shapes preserved EXACTLY as composited? (food, tray, rack must keep their shapes)
   - Did you ONLY adjust lighting, shadows, and color temperature (NO shape changes)?
   - Is internal lighting consistent within the element?
   - Are internal shadows and reflections natural?
   If shapes changed at all, you FAILED - redo this phase with shape preservation
4. GEOMETRY ANALYSIS: What are the surrounding geometric features (straight lines, curves, grid)? Note them
5. STYLE ANALYSIS: What is the base image's artistic style? Match element to this style perfectly
6. EDGE BLENDING (PHASE 2): Now handle the element's outer edges with environment
   - Analyze environment geometry (straight/curved/grid)
   - Adjust element's OUTER edges to match surrounding geometry
   - Apply soft, gradual feathering at ALL outer boundaries
   - Make edges INVISIBLE and naturally fading into background
7. LIGHTING: Adjust element's overall lighting to match environment's light source and color temperature
8. SHADOW: Add realistic shadows and ambient occlusion where element meets environment
9. FINAL VERIFICATION:
   - Are there exactly 2 hands or fewer total? ✓
   - Is the object properly aligned with character's grasp? ✓
   - Do internal components of element fuse naturally? (PHASE 1 complete) ✓
   - Do outer edges match surrounding geometry? (PHASE 2 geometry) ✓
   - Are outer edges soft and invisible? (PHASE 2 blending) ✓
   - Is element indistinguishable from original? ✓
   If ANY answer is NO, you must fix it before outputting

WHAT NOT TO DO:
✗ Do NOT skip internal fusion - element's internal components MUST be fused first (MAJOR FAILURE)
✗ Do NOT leave sharp, distinct boundaries at outer edges (MAJOR FAILURE)
✗ Do NOT keep conflicting body parts from the element (MAJOR FAILURE)
✗ Do NOT use a different style than the base image (MAJOR FAILURE)
✗ Do NOT change base image characters' faces, hair, or poses
✗ Do NOT add new objects or remove existing base content
✗ Do NOT over-blend to the point of losing element details
✗ Do NOT change the overall composition
✗ Do NOT skip either phase - BOTH internal fusion AND edge blending are mandatory

✅ SUCCESS CRITERIA (ALL must be true):
1. PHASE 1 complete: Internal components of element blend perfectly together (tray + rack + food unified) ✓
2. PHASE 2 complete: Outer edges are soft, invisible, and naturally fade into environment ✓
3. No visible outer boundaries - edges geometrically match surroundings ✓
4. No conflicting body parts - only intended element content remains ✓
5. Style perfectly matches base image ✓
6. Lighting and shadows are consistent both internally and with environment ✓
7. Impossible to tell where element was added ✓

OUTPUT: A seamlessly fused image where:
- The element's INTERNAL components (tray, rack, food) are perfectly integrated with each other (PHASE 1)
- The element's OUTER edges blend invisibly with the surrounding environment (PHASE 2)
- Soft edges, no conflicts, matching style, natural lighting, and impossible to distinguish from the original scene.`
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
  const result = await callGoogleGenerate(GOOGLE_IMAGE_MODEL, content, apiKey, {
    responseModalities: ["TEXT", "IMAGE"],
  })

  if (!result.ok) {
    console.error("[Fusion] Google API error:", result.status, result.error)
    return null
  }

  const image = extractGoogleImage(result.data)
  if (!image) {
    console.error("[Fusion] No image found in Google response")
    return null
  }

  console.log("[Fusion] Successfully fused image with Google direct API")
  return NextResponse.json({
    fused_image: normalizeDataUri(image),
    meta: { model: "google-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
  })
}

/**
 * 通过 OpenRouter 调用 Gemini 进行融合（fallback）
 */
async function fusionWithOpenRouter(
  content: OpenRouterContentPart[],
  apiKey: string,
  startTime: number
): Promise<NextResponse<FusionResponse> | null> {
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
    console.error("[Fusion] OpenRouter Gemini API error:", errorText)
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
      console.error("[Fusion] Unexpected image format in OpenRouter response")
      return null
    }

    console.log("[Fusion] Successfully fused image with OpenRouter")
    return NextResponse.json({
      fused_image: resultImage,
      meta: { model: "openrouter-gemini-2.5-flash-image", duration_ms: Date.now() - startTime },
    })
  }

  console.error("[Fusion] No image found in OpenRouter response")
  return null
}

