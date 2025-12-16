/**
 * AI 提示词常量
 */

/**
 * Gemini 图像合成系统提示词
 */
export function buildGeminiInpaintPrompt(userPrompt: string): string {
  return `You are a professional image compositor. I will provide THREE images in order:

IMAGE 1 - REFERENCE/SOURCE: The element I want to COPY FROM (what should appear in the final result)
IMAGE 2 - TARGET/BASE: The background image I want to PASTE INTO (this will be modified)
IMAGE 3 - MASK: White pixels = WHERE to paste; Black pixels = keep original

YOUR TASK - DETAILED STEP BY STEP:
1. Examine IMAGE 1 (Reference): Identify ALL visible elements, their layers, colors, and structure
2. Examine IMAGE 2 (Target): This is the BASE that will be modified
3. Examine IMAGE 3 (Mask): White region = exact location to INSERT the reference content
4. Generate OUTPUT: IMAGE 2 with the white-masked region REPLACED by elements from IMAGE 1

CRITICAL SUCCESS CRITERIA:
✓ The OUTPUT must be VISIBLY DIFFERENT from IMAGE 2 (the original target)
✓ Elements from IMAGE 1 must be CLEARLY VISIBLE in the white-masked area
✓ Preserve the EXACT structure, layers, and details from IMAGE 1
✓ Match lighting, perspective, and style between inserted content and background
✓ Maintain realistic shadows, reflections, and depth

WHAT TO COPY from IMAGE 1:
${userPrompt}

COMMON MISTAKES TO AVOID:
✗ Do NOT return IMAGE 2 unchanged
✗ Do NOT ignore IMAGE 1 content
✗ Do NOT blend so heavily that IMAGE 1 elements become invisible
✗ Do NOT create new objects not present in IMAGE 1
✗ Do NOT swap which image is the source vs target

VERIFICATION: Before outputting, ask yourself:
- Can I clearly see elements from IMAGE 1 in the result?
- Is the result different from the original IMAGE 2?
- Did I copy the complete layer structure from IMAGE 1?

OUTPUT FORMAT: A single modified image that is IMAGE 2 with IMAGE 1's content inserted into the masked region.`
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
 * FLUX 增强提示词
 */
export function buildFluxEnhancedPrompt(basePrompt: string): string {
  return `${basePrompt}. High quality, detailed, professional, seamless blend, matching style and lighting. Use the reference element image faithfully: colors, textures, and structure must match it exactly. Preserve all layers and structural elements from the reference image.`
}

/**
 * 默认 inpaint 提示词
 */
export const DEFAULT_INPAINT_PROMPT = "COPY the EXACT elements from the reference image into the masked region. Do NOT create new objects. Do NOT invent decorations. Only reproduce what you SEE in the reference."
