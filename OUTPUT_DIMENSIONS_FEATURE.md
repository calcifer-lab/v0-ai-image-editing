# 输出尺寸自定义功能说明

## 功能概述

此功能为 AI 图片编辑器添加了专业的输出尺寸自定义能力，允许用户在生成图片时选择不同的宽高比和缩放模式，使产品更加专业和灵活。

## 功能特性

### 1. 预设宽高比选项

提供了以下常用的宽高比预设：

- **Original（原始）**: 保持原始图片尺寸
- **1:1（方形）**: Instagram 风格，完美的正方形
- **4:3（标准）**: 传统显示器比例，如 1024×768
- **16:9（宽屏）**: 现代显示器和视频标准，如 1920×1080
- **3:2（经典）**: DSLR 相机常用比例
- **9:16（竖屏）**: Stories、短视频平台使用
- **Custom（自定义）**: 用户可输入精确的宽度和高度（100px - 4096px）

### 2. 智能缩放模式

支持三种专业的缩放模式：

#### Fit（适应）
- 保持图片原始宽高比
- 将图片完整显示在目标尺寸内
- 可能会在边缘添加白色边框
- 适用场景：不想裁剪任何内容，保持完整画面

#### Fill（填充）
- 裁剪图片以填充整个目标尺寸
- 保持图片的宽高比
- 可能会裁剪部分内容
- 适用场景：确保画面填满，不留白边

#### Stretch（拉伸）
- 强制调整到目标尺寸
- 可能会改变图片的宽高比
- 不会裁剪或留白
- 适用场景：必须精确匹配特定尺寸

### 3. 自定义尺寸输入

当选择"Custom"（自定义）比例时：
- 可以输入精确的宽度和高度值
- 支持范围：100px - 4096px
- 适合有特殊尺寸需求的专业用户

## 使用方法

### 界面位置

在编辑面板的右侧控制面板中，新增了"Output Dimensions"（输出尺寸）部分，包含：

1. **Aspect Ratio（宽高比）** 下拉选择器
2. **Custom Dimensions（自定义尺寸）** 输入框（仅在选择 Custom 时显示）
3. **Scale Mode（缩放模式）** 下拉选择器

### 操作流程

1. 上传元素图片和基础图片
2. 在画布上选择要编辑的区域
3. 在控制面板设置编辑参数
4. **选择输出尺寸比例**（新功能）
5. **选择缩放模式**（新功能）
6. 点击"Generate"生成结果
7. 系统会在 AI 处理完成后，自动应用您选择的尺寸设置

## 技术实现

### 新增文件

1. **[components/ui/input.tsx](components/ui/input.tsx)**: Input 输入框组件
2. **[components/ui/select.tsx](components/ui/select.tsx)**: Select 下拉选择器组件

### 修改文件

1. **[components/image-editor.tsx](components/image-editor.tsx)**
   - 新增类型定义：`AspectRatio`, `ScaleMode`, `OutputDimensions`
   - 扩展 `EditParams` 接口以包含输出尺寸配置
   - 在图片处理完成后应用尺寸调整

2. **[components/control-panel.tsx](components/control-panel.tsx)**
   - 添加输出尺寸控制 UI 部分
   - 集成宽高比选择器
   - 添加自定义尺寸输入框
   - 集成缩放模式选择器

3. **[lib/image-utils.ts](lib/image-utils.ts)**
   - 新增 `ASPECT_RATIOS` 常量配置
   - 新增 `calculateAspectRatioDimensions()` 函数：计算目标尺寸
   - 新增 `resizeToAspectRatio()` 函数：应用尺寸调整和缩放模式

### 核心算法

#### 尺寸计算逻辑

```typescript
// Fit 模式：保持宽高比，添加边框
const scale = Math.min(targetWidth / imgWidth, targetHeight / imgHeight)

// Fill 模式：保持宽高比，裁剪内容
const scale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight)

// Stretch 模式：直接拉伸到目标尺寸
```

## 代码示例

### 使用尺寸调整功能

```typescript
import { resizeToAspectRatio } from '@/lib/image-utils'

// 调整图片到 16:9 宽屏比例，使用 Fill 模式
const result = await resizeToAspectRatio(
  imageDataUrl,
  '16:9',
  'fill'
)

console.log(`调整后尺寸: ${result.width} × ${result.height}`)
```

### 自定义尺寸

```typescript
// 自定义精确尺寸
const result = await resizeToAspectRatio(
  imageDataUrl,
  'custom',
  'fit',
  1920,  // 自定义宽度
  1080   // 自定义高度
)
```

## 应用场景

### 社交媒体
- Instagram 帖子：使用 1:1
- YouTube 缩略图：使用 16:9
- Stories/Reels：使用 9:16

### 专业设计
- 网页横幅：使用自定义尺寸
- 打印材料：使用 4:3 或 3:2
- 演示文稿：使用 16:9

### 内容创作
- 视频封面：16:9
- 头像制作：1:1
- 手机壁纸：9:16

## 优势

1. **专业性提升**: 提供行业标准的宽高比选项
2. **灵活性**: 支持自定义尺寸，满足特殊需求
3. **智能处理**: 三种缩放模式适应不同使用场景
4. **用户友好**: 清晰的界面和说明，易于理解和使用
5. **无损体验**: 在 AI 生成后处理，不影响原始编辑流程

## 未来扩展

可能的功能增强方向：

1. 添加更多预设比例（如 21:9 超宽屏）
2. 支持批量输出多种尺寸
3. 保存常用尺寸预设
4. 支持输出尺寸预览
5. 添加 DPI 设置选项

## 测试建议

建议测试以下场景：

1. 使用不同宽高比（1:1, 16:9, 9:16 等）
2. 测试三种缩放模式的视觉差异
3. 验证自定义尺寸输入（边界值：100px, 4096px）
4. 测试横向和纵向图片
5. 验证极端宽高比的处理

## 技术说明

- 所有图片处理在客户端完成，使用 Canvas API
- 支持 PNG 和 JPEG 格式输出
- 使用白色背景填充边框（Fit 模式）
- 采用双线性插值确保缩放质量
