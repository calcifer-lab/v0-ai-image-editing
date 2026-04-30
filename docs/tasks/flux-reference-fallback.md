# 任务派工单 · FLUX 兜底 reference 语义修复

> 这份指令是直接发给被分配此任务的同学的，按顺序执行即可。
> 提问、阻塞、需要 review 时回到群里 @负责审查的同学。

## 0. 一行总结

`tryFluxFillPro` 给 Replicate 传了 `reference_image` 字段，但 `black-forest-labs/flux-fill-pro` **不识别这个 input**，会被静默丢弃，导致兜底出图与参考补丁完全无关（线上"乱字脸贴在哪吒脸上"截图就是这个原因之一）。

你的任务：**让 FLUX 兜底要么真正使用 reference，要么显式声明它不能用，并在日志/meta 里对上层透明**。

## 1. 分支

- 基于 `fix/editor-function`（团队集成分支，不是 main）拉新分支：
  ```
  git fetch origin
  git checkout origin/fix/editor-function -b fix/editor-flux-reference
  ```
- 只动 `app/api/inpaint/route.ts` 中下面这两个函数体：
  - `tryFluxFillPro`（约 178~263 行）
  - `tryFluxFillDev`（约 266~342 行）
- **不要改** POST handler 上半段（Google direct / OpenRouter 段），那是「inpaint fallback 状态结构化」任务的范围（另一位同事）。

## 2. 必须做的决策

二选一，**先在群里贴出你的选型再开始编码**：

### 选项 A · 真的用上 reference（推荐）

把 FLUX Fill Pro 换成支持参考图的模型。Replicate 上可选：
- `black-forest-labs/flux-kontext-pro` — input 支持 `image` + `reference_image` + `mask`
- `black-forest-labs/flux-redux-dev` — img2img with reference embedding

实施要点：
- 选定一个 model id 作为新的"主 FLUX"，旧的 `flux-fill-pro` 降为它的 fallback
- 调用前先验证该模型最新 schema（直接 curl `https://api.replicate.com/v1/models/<owner>/<name>` 确认 input 字段），把验证截图贴 PR
- 兜底失败时仍然降到 `flux-fill-dev`（无 reference），但要日志声明"reference 已丢失"

### 选项 B · 承认不能用，去掉伪传

如果尝试后发现选项 A 不可行：
- 从 `tryFluxFillPro` / `tryFluxFillDev` 的 input 里**删除** `...(reference_image ? { reference_image } : {})`
- 在路由日志里 `warn` 一条：`[Inpaint] FLUX fallback does not support reference_image; reference will be IGNORED`
- 在返回 `meta` 里加字段 `meta.reference_used: false`
- 在 PR 描述里写明这是"承认现状"型修复，并 open follow-up issue 讨论是否引入选项 A 的模型

## 3. 强制可观测性

无论选 A 或 B，**meta 必须告诉前端 reference 是否真的进了模型**：

```ts
return NextResponse.json({
  result_image: resultImage,
  meta: {
    model: "flux-fill-pro",
    duration_ms: Date.now() - startTime,
    reference_used: true | false,   // 必加
  },
})
```

这条字段在「横切日志可观测性」任务的 `logStageEvent` 合入后会同步打到日志里，暂时先以 meta 的形式落地。

## 4. 不准做

- ❌ 改 Google direct / OpenRouter 段（那是「inpaint fallback 状态结构化」任务的范围（另一位同事））
- ❌ 改 prompt 字符串（那是单独的 prompt-tuning 任务，不归你）
- ❌ 改 `lib/api/replicate.ts` 的轮询逻辑
- ❌ 改前端（`components/*` 一行不动）
- ❌ 装新依赖

## 5. 自测清单

合 PR 之前必须本地跑过：

1. `npm run build` 通过
2. **本地强制走 FLUX 路径**：临时把 `GOOGLE_API_KEY` 和 `OPENROUTER_API_KEY` 都设非法值，让 inpaint 直接走 FLUX
3. 跑 `docs/regression-cases.md` 的 **R-007**：传带参考补丁的请求，确认：
   - 选 A：返回图能看出 reference 的颜色/形状残留
   - 选 B：返回 `meta.reference_used: false`，日志有明确警告
4. 跑 R-001 / R-005 确认主链未受影响（应该走不到 FLUX，但要确认你的改动没把上游链路带挂）

## 6. PR 模板（强制字段，缺字段会被审查打回）

提交标题（按选项填）：
- `[fix/editor-flux-reference] swap FLUX fallback to <model> with real reference support`
- `[fix/editor-flux-reference] drop silently-ignored reference_image from FLUX fallback`

PR 描述必须包含：

```markdown
## 修复前错误码
N/A（业务正确性 bug，无 HTTP 错码）
现象：FLUX 兜底返回的图与 reference_image 完全无关；reference_image 字段被 Replicate 静默丢弃。

## 修复后行为
（按你选 A 或 B 写实际行为）

## 覆盖回归用例 ID
- R-007（FLUX 兜底 + reference 语义验证）
- R-001 主链未受影响（回归对照）
- R-005 composite 主链未受影响（回归对照）

## 是否新增降级逻辑
- 选 A：是，主 FLUX → 旧 flux-fill-pro/dev 的二级降级；meta.reference_used 暴露状态
- 选 B：否，仅去除伪传字段；meta.reference_used 暴露状态

## 关键日志样例
（粘贴 R-007 跑出来的真实日志，含 meta.reference_used）
```

## 7. 时间预算

- 选 A 编码 + 自测：~3~4h（涉及 schema 摸索）
- 选 B 编码 + 自测：~1h
- 合理上限：1 个工作日

选 A 阻塞超过半天就果断切到选 B，先把 meta 透明化合上去，A 留给下一个迭代。
