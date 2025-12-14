/**
 * AI 提示词常量
 */

/**
 * Gemini 图像合成系统提示词
 */
export function buildGeminiInpaintPrompt(userPrompt: string): string {
  return `You are a precision image compositor. Your task is to COPY the EXACT visual content from the REFERENCE IMAGE into the masked region.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW EXACTLY:

1. LOOK AT THE REFERENCE IMAGE CAREFULLY:
   - Study the REFERENCE IMAGE in detail
   - Identify EXACTLY what objects/elements appear in the region corresponding to the mask
   - For feet/lower body: look for wheels, fire wheels (风火轮 - golden rings with flames), special footwear, platforms, etc.
   - DO NOT INVENT OR CREATE NEW OBJECTS - only copy what you SEE in the reference

2. COPY EXACTLY WHAT YOU SEE:
   - If the reference shows FIRE WHEELS (金色圆环带火焰的风火轮) under the feet → reproduce those EXACT fire wheels
   - If the reference shows golden circular wheels with orange flames → copy those EXACT golden wheels with flames
   - Do NOT substitute with different objects
   - Do NOT create random decorative elements
   - Do NOT simplify or abstract the objects

3. VISUAL FIDELITY IS CRITICAL:
   - Match the EXACT shape (circular wheels, not random shapes)
   - Match the EXACT colors (golden rings, orange/red flames)
   - Match the EXACT effects (fire, glow, energy)
   - The output must look like a direct copy-paste of the reference element

4. User's request: ${userPrompt}

IMPORTANT: Look at the reference image RIGHT NOW. See what is under the character's feet. Copy THAT EXACT THING. Do not create something different.`
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

Your response MUST follow this exact format:

**Selected Element**: [What is the main object/element in this cropped selection? Be specific: food, object, item, clothing piece, etc.]

**Visual Description**:
- Object: [Exact description of the main object/element selected]
- Colors: [Exact colors you see]
- Material/Texture: [What material or texture does it appear to be?]
- Shape: [Describe the shape and form]

**Style**: [photorealistic, cartoon, 3D render, anime, illustration, etc.]

**Key Details to Preserve**:
- List 2-3 most important visual details that MUST be faithfully reproduced when transferring this element

REMEMBER: Only describe what is VISIBLE in this cropped image. If you see food on a tray, describe the food and tray. Do NOT describe people holding it if they are not in this cropped selection.`

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
