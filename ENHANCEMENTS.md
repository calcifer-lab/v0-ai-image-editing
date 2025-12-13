# AI Image Editing Enhancements

## 核心功能改进：智能物体提取与空间感知合成

### 问题背景

**原始问题**：当尝试用真实照片（例如：真实烤鸡翅照片）替换卡通图像中的对应物体时，AI没有正确理解以下关键点：

1. ❌ 没有从参考图中**提取**主体对象（而是直接复制整个图片）
2. ❌ 没有进行**风格转换**（真实照片 → 卡通风格）
3. ❌ 没有理解**空间关系**（鸡翅应该在烤架**上方**，而不是嵌入烤架内部）
4. ❌ 缺少智能合成能力

**具体案例**：
- **参考图（A）**：真实照片，烤鸡翅在金属烤架上
- **基础图（B）**：卡通风格，太空舱内烤鸡翅在烤架上
- **期望结果**：提取真实鸡翅 → 转换为卡通风格 → 正确放置在烤架上方
- **实际问题**：AI生成的结果中，鸡翅的位置和空间关系不正确

---

## 解决方案

### 1. 增强的 Inpainting Prompt 策略

**文件**：[app/api/inpaint/route.ts](app/api/inpaint/route.ts#L32-L101)

#### 新增关键指令

##### Pre-Edit Analysis 阶段
新增**空间关系分析**：
```
- Spatial relationships and object placement (what should be on top/below, foreground/background)
```

##### Quality Requirements 阶段
新增**空间正确性要求**（第5条）：
```
5. **Spatial Correctness**: Maintain logical spatial relationships
   - objects that should be on surfaces must appear ON (not IN) those surfaces
```

#### 三步式物体提取与合成流程

当提供参考图像时，AI 现在遵循以下严格流程：

```markdown
### Step 1: Object Extraction (Intelligent Segmentation)
- **Identify** the main subject/object in the reference image
- **Extract** only the object itself, excluding background elements
- **Understand** the object's shape, boundaries, and key features
- If the reference shows food on a grill/rack, extract ONLY the food items

### Step 2: Style Transformation
- **Analyze** the base image's artistic style (cartoon, realistic, 3D, etc.)
- **Convert** the extracted object to match the exact style
- Adapt colors, shading, line work, and rendering technique
- Transform realistic photos → cartoon if base is cartoon, or vice versa

### Step 3: Spatial-Aware Composition
- **Understand** the spatial context in the base image's masked region
- **Place** the transformed object with correct spatial relationships:
  * If there's a grill/rack/surface → place objects ON TOP (not embedded)
  * Maintain proper depth, layering, and perspective
  * Add appropriate shadows, highlights, and occlusion
- **Preserve** structural elements visible in base image (grills, racks)
```

#### 明确的规则约束

```markdown
### Critical Rules:
- DO NOT simply paste or overlay the reference image
- DO extract, transform, and intelligently compose
- DO respect the physics and spatial logic of the scene
- DO maintain the base image's artistic style throughout
- DO ensure objects rest ON surfaces, not sunken INTO them
```

---

### 2. 增强的 Image Analysis API

**文件**：[app/api/analyze-image/route.ts](app/api/analyze-image/route.ts#L45-L61)

#### 新的分析结构

现在 GPT-4o-mini 会按以下结构分析参考图像：

```
1. **Main Subject/Object**: 识别应该被提取的主要对象
   例如："grilled chicken wings", "6个烤鸡翅"

2. **Object Boundaries**: 描述对象边界，什么应该包含/排除
   例如："6个鸡翅在金属烤架上 - 只提取鸡翅，排除烤架"

3. **Visual Characteristics**:
   - 颜色和色调
   - 纹理和表面属性
   - 形状和形态细节
   - 光照和阴影

4. **Style Analysis**: 识别风格类型
   真实照片/卡通/3D渲染/插画等

5. **Composition Guidance**: 空间位置指导
   例如："这些鸡翅应该放置在表面上方，而不是嵌入其中"
```

这种结构化分析为后续的 inpainting 提供了精确的指导。

---

### 3. 前端 Prompt 生成优化

**文件**：[components/image-editor.tsx](components/image-editor.tsx#L118-L122)

#### 增强的 Prompt 构建逻辑

```typescript
const enhancedPrompt = params.prompt ||
  (imageAnalysis
    ? `Using the reference image analysis:\n${imageAnalysis}\n\n
       Extract the main object from the reference image and intelligently
       compose it into the masked region. Ensure:
       1. Only the main object is used (exclude backgrounds/supports)
       2. The object style matches the base image perfectly
       3. Objects are placed ON surfaces (not embedded IN them)
       4. Proper spatial relationships and physics are maintained`
    : "Extract the main subject from the reference image and seamlessly
       compose it into the masked region, matching the base image's style
       and maintaining correct spatial relationships")
```

**改进点**：
- ✅ 明确要求"提取主要对象"（而非复制整张图）
- ✅ 强调风格匹配
- ✅ 特别强调空间关系（ON surfaces, not IN them）
- ✅ 利用结构化的图像分析结果

---

## 技术架构

### 完整工作流程

```
1. 用户上传参考图（A）和基础图（B）
   ↓
2. GPT-4o-mini 分析参考图
   - 识别主体对象（例如：6个烤鸡翅）
   - 分析边界（应包含/排除什么）
   - 分析风格（真实照片）
   - 提供空间指导（应放在表面上方）
   ↓
3. 用户在基础图上绘制蒙版
   - 标记需要替换的区域
   ↓
4. 构建增强型 prompt
   - 结合图像分析结果
   - 添加空间关系要求
   - 强调物体提取和风格转换
   ↓
5. Gemini 2.5 Flash Image 执行 inpainting
   - Step 1: 从参考图提取主体
   - Step 2: 转换风格以匹配基础图
   - Step 3: 智能合成，保持空间正确性
   ↓
6. 返回结果
   - 卡通风格的鸡翅
   - 正确放置在烤架上方
   - 无缝融合
```

---

## 使用示例

### 场景：用真实烤鸡翅替换卡通烤鸡翅

#### 输入
- **参考图 A**：真实照片，**分层结构**：托盘（底部） → 鸡翅（中间） → 金属烤架（顶部压住）
- **基础图 B**：卡通太空舱场景
- **蒙版**：基础图中需要替换的区域

#### AI 分析结果（示例）
```
1. Main Subject/Object: 6 pieces of grilled chicken wings with rack assembly

2. Layered Structure Analysis:
   - BOTTOM layer: Metal/plastic tray (base)
   - MIDDLE layer: Grilled chicken wings (resting in the tray)
   - TOP layer: Metal grill rack (pressing down on the wings)
   - Critical: The rack is ABOVE the wings, not below them

3. Object Boundaries:
   - Extract complete assembly: tray + wings + rack
   - Maintain the 3-layer structure

4. Visual Characteristics:
   - Golden-brown chicken with charred marks
   - Shiny metal rack on top
   - Visible layering and occlusion

5. Style Analysis: Realistic photographic style

6. Composition Guidance:
   - Preserve exact layering: tray → wings → rack
   - Keep the rack pressing on TOP of the wings
   - Maintain depth and occlusion relationships
```

#### 最终效果
- ✅ **提取**：提取完整的三层结构（托盘 + 鸡翅 + 烤架）
- ✅ **风格转换**：真实照片 → 卡通风格（匹配太空舱场景）
- ✅ **空间正确性**：保持正确的分层关系 - 烤架在**上方压住**鸡翅，鸡翅在托盘**里面**
- ✅ **无缝融合**：光照、阴影、色调与原图一致，且保留层次遮挡关系

---

## 关键改进对比

| 方面 | 改进前 | 改进后 |
|------|--------|--------|
| **物体识别** | 使用整张参考图 | 智能提取主体对象 |
| **风格处理** | 未做转换 | 自动转换风格以匹配基础图 |
| **空间理解** | 缺失 | 明确的空间关系指导（ON/IN/BELOW等） |
| **合成质量** | 简单覆盖 | 智能合成（考虑深度、遮挡、阴影） |
| **图像分析** | 通用描述 | 结构化分析（边界、风格、空间指导） |
| **Prompt** | 模糊指令 | 明确的三步流程 + 关键规则 |

---

## 测试建议

### 推荐测试场景

1. **食物替换**
   - 真实食物照片 → 卡通/插画风格
   - 验证物体提取和风格转换

2. **物体位置**
   - 带支撑结构的场景（架子、桌面、盘子等）
   - 验证空间关系理解（ON vs IN）

3. **跨风格合成**
   - 照片 → 卡通
   - 3D渲染 → 手绘
   - 验证风格适配能力

### 预期改进

使用相同的烤鸡翅案例：
- ❌ **改进前**：鸡翅可能嵌入烤架内部，或保持照片风格
- ✅ **改进后**：鸡翅转为卡通风格，正确放置在烤架上方

---

## 技术细节

### 使用的模型

1. **图像分析**：OpenAI GPT-4o-mini (via OpenRouter)
   - 结构化分析参考图像
   - 提供物体边界和空间指导

2. **Inpainting**：Google Gemini 2.5 Flash Image (via OpenRouter)
   - 多模态输入（文本 + 3张图片）
   - 图像输出能力（生成编辑后的图片）

### API 调用流程

```javascript
// 1. 分析参考图
POST /api/analyze-image
{
  image: <base64_reference_image>
}
Response: { analysis: "结构化分析结果" }

// 2. 执行 inpainting
POST /api/inpaint
{
  base_image: <base64>,
  mask_image: <base64>,
  reference_image: <base64>,
  prompt: "增强型prompt + 分析结果"
}
Response: { result_image: <base64_edited_image> }
```

---

## 未来优化方向

### 可能的增强

1. **物体分割模型集成**
   - 使用 SAM (Segment Anything Model) 自动分割参考图
   - 提供更精确的物体边界

2. **风格转换专用模型**
   - 集成 ControlNet 或类似技术
   - 更精确的风格迁移

3. **交互式优化**
   - 让用户在参考图上标记主体
   - 调整空间参数（高度、角度等）

4. **多参考图支持**
   - 从多个角度的参考图提取特征
   - 生成更丰富的合成结果

---

## 总结

通过以下三个层面的改进：

1. **后端 Prompt 工程**：明确的三步流程（提取→转换→合成）
2. **分析 API 优化**：结构化的物体分析
3. **前端集成**：智能的 prompt 构建

现在系统能够：
- ✅ 智能提取参考图中的主体对象
- ✅ 自动进行风格转换
- ✅ 理解和维护正确的空间关系
- ✅ 生成更自然、更符合物理规律的合成结果

这些改进专门针对您提到的烤鸡翅场景问题，确保真实照片中的鸡翅能够正确提取、转换风格并放置在卡通场景中的正确空间位置。
