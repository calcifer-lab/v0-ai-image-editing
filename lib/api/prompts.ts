/**
 * AI 提示词常量
 */

/**
 * Gemini 图像合成系统提示词
 */
export function buildGeminiInpaintPrompt(userPrompt: string): string {
  return `You are a professional image compositor performing an INPAINTING task. I will provide THREE images:

IMAGE 1 - REFERENCE/SOURCE: Contains the NEW CONTENT to insert
IMAGE 2 - TARGET/BASE: The background image to modify (MUST be changed)
IMAGE 3 - MASK: White pixels = region to REPLACE with IMAGE 1 content

⚠️ CRITICAL: This is an INPAINTING operation. The masked region in IMAGE 2 MUST be COMPLETELY REPLACED with content from IMAGE 1. This is NOT a blending or harmonization task - you must OVERWRITE the masked region.

YOUR TASK:
1. Study IMAGE 1: Note EVERY detail of ${userPrompt}
2. Study IMAGE 2: This is the canvas to MODIFY (not preserve)
3. Study MASK (IMAGE 3): White area = DELETE IMAGE 2 content here and INSERT IMAGE 1 content
4. Generate OUTPUT: IMAGE 2 with masked region COMPLETELY REPLACED by IMAGE 1 elements

MANDATORY REQUIREMENTS:
✓ REPLACE (not blend) - The white-masked area must contain IMAGE 1's content, NOT IMAGE 2's original content
✓ VISIBLE CHANGE - Output MUST look different from IMAGE 2 in the masked region
✓ EXACT COPY - Preserve all details from IMAGE 1: colors, textures, layers, structure
✓ SEAMLESS INTEGRATION - Match lighting, shadows, perspective to background
✓ LAYER FIDELITY - Maintain the exact layer structure from IMAGE 1

WHAT TO INSERT from IMAGE 1:
${userPrompt}

❌ CRITICAL FAILURES TO AVOID:
✗ Returning IMAGE 2 with minimal/no changes (FAILURE)
✗ Blending IMAGE 1 so heavily it becomes invisible (FAILURE)
✗ Preserving IMAGE 2's original content in the masked area (FAILURE)
✗ Creating new objects not in IMAGE 1 (FAILURE)
✗ Confusing which image is source vs target (FAILURE)

✅ SUCCESS CHECK - Before generating, verify:
1. Did I REPLACE the masked region completely? (not just blend)
2. Can I clearly see IMAGE 1's elements in the output?
3. Is the masked region DIFFERENT from IMAGE 2's original?
4. Did I copy the COMPLETE layer structure from IMAGE 1?

If you answered NO to any question above, you have FAILED the task.

OUTPUT: Generate IMAGE 2 with the masked region COMPLETELY REPLACED (not blended) with IMAGE 1's content. The change must be OBVIOUS and VISIBLE.`
}

/**
 * 图像分析提示词 - 用于分析整个图片
 */
export const IMAGE_ANALYSIS_PROMPT = `Analyze this reference image for element extraction. Your response MUST follow this exact format:

**Main Subject**: [Brief description of the main character/object in the image]

**Extractable Elements** (CRITICAL - list each distinct element that could be extracted):
- HEAD: [description if visible - hair, face features, accessories]
- BODY: [description if visible - clothing, armor, accessories]  
- ARMS/HANDS: [description if visible - weapons, items held]
- LEGS/FEET: [description if visible - footwear, special items like wheels, boots, etc.]
- SPECIAL ITEMS: [any unique elements like: fire wheels (风火轮), wings, halos, weapons, etc.]

**Visual Details for Each Element**:
- Colors: [exact colors of each element]
- Effects: [flames, glow, sparkles, steam, etc.]
- Style: [photorealistic, cartoon, 3D render, anime, etc.]

**Key Elements to Preserve**:
- List the most distinctive/important elements that MUST be faithfully reproduced
- Example: "golden fire wheels with orange flames on feet" or "red cape flowing behind"

IMPORTANT: Focus on identifying DISTINCT EXTRACTABLE ELEMENTS so the AI knows what to copy when a specific region is masked.`

/**
 * 裁剪区域分析提示词 - 用于分析用户选择的特定区域
 */
export const CROPPED_REGION_ANALYSIS_PROMPT = `You are analyzing a CROPPED/SELECTED region from an image. The user has specifically selected this area because they want to extract or transfer this element.

CRITICAL INSTRUCTIONS:
1. ONLY describe what you see in THIS CROPPED IMAGE - nothing else
2. Do NOT speculate about what might be outside the visible area
3. Do NOT describe characters, people, or context that is NOT visible
4. Focus ENTIRELY on the objects/elements visible in this cropped selection
5. MUST identify the LAYERED STRUCTURE - what is on top, what is below, what contains what

Your response MUST follow this exact format:

**Selected Element**: [What is the overall selection? Be specific]

**Layer Structure** (CRITICAL - from TOP to BOTTOM):
- Layer 1 (Top): [What is on the very top? e.g., "food items", "decorations"]
- Layer 2: [What is directly below Layer 1? e.g., "metal grill/rack", "plate"]
- Layer 3: [If exists, what is below Layer 2? e.g., "tray base", "container"]
- ... [Continue for all visible layers]
- Layer N (Bottom): [What is at the very bottom of the selection?]

**Spatial Relationships**:
- [Describe how layers relate: "Food items REST ON the metal grill", "Grill SITS INSIDE the tray", etc.]
- [Note any containment: "X contains Y", "Y is held by X"]

**Visual Details Per Layer**:
- Layer 1: [Colors, texture, material, shape]
- Layer 2: [Colors, texture, material, shape]
- ... [For each layer]

**Style**: [photorealistic, cartoon, 3D render, anime, illustration, etc.]

**Key Structural Details to Preserve**:
1. [Most important structural relationship]
2. [Second most important detail]
3. [Third important detail]

EXAMPLE for food on a tray:
- Layer 1 (Top): 6 glazed pastries, golden-brown color
- Layer 2: Metal wire grill/rack with parallel bars
- Layer 3 (Bottom): Dark rectangular tray with raised edges
- Relationships: Pastries rest on grill; Grill sits in tray; Tray contains everything

REMEMBER: Accurately identifying layers and their relationships is ESSENTIAL for faithful reproduction.`

/**
 * AI Compose harmonization prompt (composite-first flow).
 * Used when a pre-composited preview is available — Gemini's job is to regenerate
 * textures inside the mask so the already-positioned element matches scene lighting,
 * NOT to figure out placement from scratch.
 */
export function buildGeminiComposeHarmonizationPrompt(
  userPrompt: string,
  options?: {
    elementAnalysis?: string | null
    maskBboxNorm?: { x0: number; y0: number; x1: number; y1: number } | null
  }
): string {
  const analysisBlock = options?.elementAnalysis
    ? `\n\nREFERENCE ELEMENT ANALYSIS (these details MUST appear in your output):\n${options.elementAnalysis.trim()}`
    : ""
  const bboxBlock = options?.maskBboxNorm
    ? `\n\nMASK BOUNDING BOX (normalized 0..1 in IMAGE 1):\nx0=${options.maskBboxNorm.x0.toFixed(3)} y0=${options.maskBboxNorm.y0.toFixed(3)} x1=${options.maskBboxNorm.x1.toFixed(3)} y1=${options.maskBboxNorm.y1.toFixed(3)}\nEdit ONLY pixels inside this region. Pixels outside MUST be byte-identical to IMAGE 1.`
    : ""

  return `You are performing reference-guided HARMONIZATION inpainting.

You will receive FOUR images:
- IMAGE 1 — BASE: the original scene (must be preserved outside the mask)
- IMAGE 2 — COMPOSITE PREVIEW: IMAGE 1 with the reference element already placed at the correct position and scale. Use this as the geometric ground truth — do NOT reposition or rescale.
- IMAGE 3 — REFERENCE: a clean cutout of the element. Use this to verify exact colors, materials, layered structure, and small details that the composite preview may have softened.
- IMAGE 4 — MASK: white = the editable region, black = preserve IMAGE 1 unchanged.

YOUR TASK:
Generate a single image that equals IMAGE 1 outside the white mask, and inside the white mask shows the reference element from IMAGE 3 sitting in IMAGE 1's scene with naturally matching lighting, shadows, color temperature, perspective, and grain.

HARD CONSTRAINTS (failure if violated):
1. Element identity is fixed — the object inside the mask must be the same object as IMAGE 3. Do not substitute or invent a similar-looking thing.
2. Element geometry is fixed — keep the position, scale, orientation, and silhouette from IMAGE 2.
3. Outside the mask: IMAGE 1 unchanged. No global recoloring, no recropping, no aspect change.
4. Inside the mask: regenerate only what is needed to make the element belong — re-light, cast contact shadows, integrate edges, match film/render style. Keep the element's own colors, textures, and layered structure recognizable.
5. Do not add new objects, decorations, text, or watermarks anywhere.

USER INTENT:
${userPrompt}${analysisBlock}${bboxBlock}

Return only the final composited image.`
}

/**
 * FLUX 增强提示词
 */
export function buildFluxEnhancedPrompt(basePrompt: string): string {
  return `${basePrompt}. High quality, detailed, professional, seamless blend, matching style and lighting. Use the reference element image faithfully: colors, textures, and structure must match it exactly. Preserve all layers and structural elements from the reference image.`
}

/**
 * 默认 inpaint 提示词
 */
export const DEFAULT_INPAINT_PROMPT = "COPY the EXACT elements from the reference image into the masked region. Do NOT create new objects. Do NOT invent decorations. Only reproduce what you SEE in the reference."
