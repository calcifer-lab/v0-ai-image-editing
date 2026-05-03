# 任务总结 · 关键链路稳定性（阶段 1：可观测 + 降级显化）

> 配套手册：本仓 `docs/regression-cases.md`、Function 分支多人协作手册（飞书）。
> 本任务对应分支：`claude/stabilize-critical-path-Z8OFl`，目标分支 `function/main` / `fix/editor-function`。

## 0. 一行总结

把已经各自存在的 stage 日志拼成**一条贯穿用户单次点击的链**，并把"成功但降级"从 `error` 升格为 `warning`，让前后端都能看清主链 vs fallback。

## 1. 这次改了什么

### 1.1 `requestId` 端到端串联

- 前端 `hooks/use-image-editor.ts` 在每次 `handleProcess()` 调用时通过 `newRequestId()` 生成一次 ID。
- 所有内部 fetch（`/api/remove-background`、`/api/inpaint`、`/api/fusion`）携带 `x-request-id` header。
- 所有路由用新增的 `resolveRequestId(request.headers.get("x-request-id"))` 读取该 ID；缺失或格式不合法时回退 `newRequestId()`。
- 所有路由把 `requestId` 写进返回的 `meta`，前端日志可以再次确认链路一致。

效果：在 Vercel 日志里 `grep "req_<timestamp>_<rand>"` 即可拉出一次用户点击的全部 stage 行（process → analyze → inpaint/composite → fusion → result）。

### 1.2 `remove-background` 加入 stage=`process` 打点

之前这个路由只有 `console.log` / `console.error`，没接入 `logStageEvent`。
现在在以下位置打点：

| 位置 | level | 关键字段 |
|---|---|---|
| 入口（接收请求 + 尺寸） | info | provider=replicate, model=rembg, input_meta.bytes |
| 输入校验失败 | warn | error_code=`INVALID_INPUT_<status>` |
| 缺少 API key | error | error_code=`REPLICATE_API_KEY_MISSING` |
| Replicate HTTP 非 2xx | error | error_code=`HTTP_<status>` |
| 轮询失败 | error | error_code=`PREDICTION_FAILED` / `NO_OUTPUT_URL` |
| 成功 | info | model=rembg, elapsed_ms |
| 未捕获异常 | error | error_code=`UNHANDLED_EXCEPTION` |

### 1.3 前端 `useImageEditor` 全链路打点

新增的客户端 stage 事件（统一走 `logStageEvent`，与服务端共享一份 schema）：

- `stage=process` 入口（开始处理）
- `stage=composite` / `stage=inpaint` 进入子模式
- `stage=process` 调 rembg 的成功 / 降级
- `stage=inpaint` HTTP 失败 / 缺 result_image / 成功（含 model + fallback_from/to）
- `stage=fusion` HTTP 失败 / passthrough 降级 / 成功
- `stage=inpaint` AI 模式整体失败 → `fallback_to=composite`
- `stage=result` 完成（含端到端 `elapsed_ms`）
- `stage=process` 顶层未捕获 (`error_code=PROCESS_FAILED`)

### 1.4 把 "成功但降级" 改成 warning，不再是 error

`runFusionPass` 之前在以下三种情况都调用了 `setError(...)`：

1. fusion HTTP 非 2xx
2. fusion 抛错（网络/abort）
3. fusion 返回 `meta.model === "passthrough"`

但这三种情况**前端都仍然展示了拼图结果**，只是少了 AI 融合一步。
红色错误 + 实际有结果的 UI 极度误导，会让用户以为失败要重来。

现在统一改成 `setWarning(...)`，文案：
- HTTP/throw/passthrough：`"AI blending unavailable — showing the unblended composite. You can try again later."`

`results-view.tsx` 的硬编码中文 `直接拼图（AI 不可用）` 改为英文 `Direct composite (AI unavailable)` 与全站语言一致。
AI 模式整体失败回退 Direct Patch 的提示也从 `"AI 不可用，显示的是直接拼图"` 改为 `"AI compose unavailable — showing the direct composite instead."`。

### 1.5 类型补齐

- `UseImageEditorReturn` 新增 `warning: string | null`（之前已经在 hook 中返回但未在接口里声明，TS 严格模式会报错）。
- `InpaintResponse.meta` / `AnalyzeImageResponse.meta` / `RemoveBackgroundResponse.meta` 新增可选 `requestId` / `fallback_from` / `fallback_to`。
- 顺带消除两个 pre-existing TS 错误（`Property 'warning' does not exist on type 'UseImageEditorReturn'`）。

## 2. 没动什么

- Fallback 链路本身（Google → OpenRouter → FLUX 顺序）一行都没改。
- `analyze-image` / `inpaint` / `fusion` 已有的 stage 日志位置都保留，仅替换 ID 来源。
- prompts、模型 ID、`MAX_*_BYTES` 边界值都没动。
- 没装新依赖。

## 3. 自测

- ✅ `pnpm run build` 通过（Next.js 16）。
- ✅ `pnpm exec tsc --noEmit` 比起改动前少 2 个 error；剩 1 个是 `results-view.tsx:213` 的 `RefObject` 类型错误，与本任务无关，已存在于改动前。

## 4. 还没做（留给下一阶段）

按手册"阶段 4：按风险优先级修"的顺序：

1. 阻断型：mask 对齐（R-002）、12MB 边界（R-004）的回归脚本化。
2. 数据错位：`resizeMaskToMatchImage` 在极端比例下偏移。
3. 高频第三方：FLUX 兜底 `reference_used: false` 的语义补强（已有 task 文件 `flux-reference-fallback.md`）。
4. 质量型：fusion prompt 在硬边场景下的稳定性。
5. SLI 看板：把上述结构化日志接入 Vercel logs query 或外部聚合，落地"端到端成功率 / fallback 触发率"。

## 5. 关键日志样例

成功主链（AI mode）：

```
[stage:process] {"level":"info","requestId":"req_1714712345678_ab12cd","stage":"process","mode":"ai","message":"user-initiated process started", ...}
[stage:inpaint] {"level":"info","requestId":"req_1714712345678_ab12cd","stage":"inpaint","mode":"ai","message":"starting AI compose pipeline", ...}
[stage:process] {"level":"info","requestId":"req_1714712345678_ab12cd","stage":"process","provider":"replicate","model":"rembg","elapsed_ms":4123, ...}
[stage:inpaint] {"level":"info","requestId":"req_1714712345678_ab12cd","stage":"inpaint","provider":"google","model":"gemini-2.5-flash-image","elapsed_ms":18432, ...}
[stage:result]  {"level":"info","requestId":"req_1714712345678_ab12cd","stage":"result","mode":"ai","elapsed_ms":24000, ...}
```

Fusion 降级（composite mode，Gemini 全挂）：

```
[stage:fusion] {"level":"warn","requestId":"req_...","stage":"fusion","mode":"composite","error_code":"PASSTHROUGH","fallback_from":"fusion","fallback_to":"composite","elapsed_ms":2105, ...}
```

UI：黄色 warning 横幅 + `Direct composite (AI unavailable)` 标题，用户能看到结果但被告知质量降级。
