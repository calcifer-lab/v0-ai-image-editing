# 编辑器标准回归用例（R-001 ~ R-008）

> 每次 PR 必须在描述中声明覆盖了哪些 R-ID。集成同学在合并到 `fix/editor-function` 前必须跑全 8 条。
> 测试资产统一放在 `docs/regression-assets/`（如尚未建立，由首次集成窗口的值班同学落地）。

## 通用约定

- **环境**：本地 `npm run dev` + 真实 `GOOGLE_API_KEY` / `OPENROUTER_API_KEY` / `REPLICATE_API_KEY`
- **入口**：`/editor` 页面的「Upload → Mask → (可选 reference) → Fix」流程
- **每条用例必须记录**：`requestId`、命中的 `meta.model`、各 stage `elapsed_ms`、出现的 `error_code`
- **判定标准**：除 R-006/R-007/R-008 是降级行为验证外，其它必须主链一次成功
- **截图归档**：失败时上传输入图 + mask + 输出图 + 完整日志到 issue

## 用例清单

### R-001 · AI 主链 · 横向图 · 带参考补丁
**目的**：验证 inpaint 主链（Google direct → 命中）。
- **输入**：`base_image` 1280×720 PNG ≤2MB；`reference_image` 256×256 PNG ≤512KB；`prompt = "replace the masked region with the reference element"`
- **操作**：在 base 中央矩形 mask 一块（面积 15%~25%）；上传 reference；点击「AI Fix」
- **期望 stage chain**：upload → mask → analyze → inpaint
- **期望 meta**：`meta.model === "google-gemini-2.5-flash-image"`
- **pass**：返回图中 masked 区域明显被 reference 内容替换；非 masked 区域像素级不变
- **fail 信号**：`meta.model` 落到 `openrouter-*` 或 `flux-*` → Google direct 仍有问题；返回图与原图视觉一致 → 模型没听 prompt

### R-002 · AI 主链 · 竖向图 · 带参考补丁（mask 对齐）
**目的**：验证非正方形比例下 mask 缩放不偏移。
- **输入**：`base_image` 720×1280 PNG；`reference_image` 任意；mask 偏左下角
- **期望**：返回图替换区域与 mask 在 base 上的实际位置严格对齐（误差 ≤ 4px）
- **fail 信号**：替换区域整体偏移、被裁切、或拉伸到错误比例 → `resizeMaskToMatchImage()` bug

### R-003 · AI 主链 · 无参考补丁（纯 prompt）
**目的**：验证不带 reference 时不会因为缺字段崩。
- **输入**：base + mask + `prompt = "remove the object in the masked region and fill with surrounding background"`，**不传** `reference_image`
- **期望 stage chain**：upload → mask → inpaint（跳过 analyze 的 reference 分析路径）
- **pass**：返回 200 + 合理修复结果
- **fail 信号**：500 / 字段缺失报错 / 返回原图未改

### R-004 · AI 主链 · 大图边界
**目的**：验证 `MAX_INPAINT_IMAGE_BYTES = 12MB` 与 `MAX_INPAINT_REFERENCE_BYTES = 8MB` 的边界。
- **输入 A**：`base_image` 11.5MB（应通过）+ `reference_image` 7.5MB（应通过）
- **输入 B**：`base_image` 12.5MB（应被拒，HTTP 413）
- **期望**：A 正常返回；B 返回 4xx 且 `error` 文案明确指出超限字段
- **fail 信号**：A 返回 413（边界算错）；B 返回 500（验证逻辑没拦住直接打到上游）

### R-005 · Composite 主链 · 直贴 + 必经 fusion
**目的**：验证 composite mode 的 fusion 阶段把贴出来的硬边融化。
- **输入**：base + reference + mask；mode 切到「composite/direct paste」
- **期望 stage chain**：upload → mask → composite → fusion
- **期望 meta**：`meta.model` 含 `gemini-2.5-flash-image`（fusion 调用 Google direct）
- **pass**：贴入元素与背景在光照、阴影、边缘上有明显融合，无矩形硬边
- **fail 信号**：返回图能一眼看出贴图矩形边界 → fusion 没跑成功 / 跌到了原始 composite

### R-006 · Fallback · Google 404 → OpenRouter 接管
**目的**：验证 Google direct 失败时降级链路完整。
- **触发方式**：临时把 `GOOGLE_API_KEY` 设为非法值（或 mock fetch 返回 404）
- **期望**：inpaint 路由日志出现 `[Inpaint] Google API error: 404 ...` → 接着 `[Inpaint] Trying OpenRouter...` → 最终 200
- **期望 meta**：`meta.model === "openrouter-gemini-2.5-flash-image"`
- **fail 信号**：直接 502 / 跳过 OpenRouter 直奔 FLUX

### R-007 · Fallback · 全部 Gemini 失败 → FLUX 兜底
**目的**：验证最末端兜底，且 reference 语义不能被静默丢弃。
- **触发方式**：`GOOGLE_API_KEY` 与 `OPENROUTER_API_KEY` 都改为非法值；只留 `REPLICATE_API_KEY`
- **期望 stage**：Google → OpenRouter → FLUX Fill Pro
- **期望 meta**：`meta.model` 为 `flux-fill-pro` 或 `flux-fill-dev`
- **pass**：返回结果至少在 prompt 描述上是合理的；**且日志或 meta 中明确标注 reference 是否被使用**（由「FLUX 兜底 reference 语义修复」任务交付）
- **fail 信号**：`reference_image` 被静默吞掉无任何日志；或返回结果与 prompt 完全无关

### R-008 · Quota · Google 429 → fallback 链路全程通畅
**目的**：复刻线上 free tier quota=0 的场景。
- **触发方式**：使用一个已耗尽配额的 `GOOGLE_API_KEY`（或 mock 返回 429 RESOURCE_EXHAUSTED）
- **期望**：所有调 Google direct 的路由（analyze-image / inpaint / fusion）都能在 429 后无延迟降级
- **pass**：`analyze-image` 命中 `openai/gpt-4o-mini`；`inpaint` 命中 `openrouter-gemini-2.5-flash-image`
- **fail 信号**：429 后路由整体 502；或 retry 卡住超时

## 失败定位速查（按 stage）

| 失败现象 | 可疑 stage | 排查文件 |
|---|---|---|
| 上传后 base64 损坏 | upload | `lib/api/replicate.ts` 的 `validateImageDataUrl` |
| mask 与 base 不对齐 | mask | `lib/api/replicate.ts` 的 `resizeMaskToMatchImage` + `components/canvas-editor.tsx` |
| 跳过 reference 分析 | analyze | `app/api/analyze-image/route.ts` |
| 主链返回原图 | inpaint | `app/api/inpaint/route.ts` 的 `inpaintWithGoogle` |
| 贴图硬边没消 | fusion | `app/api/fusion/route.ts` |
| 导出文件名 .jfif | result | `normalizeDataUri()` |
