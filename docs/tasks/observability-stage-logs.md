# 任务派工单 · 横切日志可观测性

> 这份指令是直接发给被分配此任务的同学的，按顺序执行即可。
> 提问、阻塞、需要 review 时回到群里 @负责审查的同学。

## 0. 一行总结

实现统一的 `logStageEvent()` helper，并以 `app/api/analyze-image/route.ts` 为参考实现接入。**只动这两块，别碰其它路由**。

## 1. 分支

- 基于 `fix/editor-function`（团队集成分支，不是 main）拉新分支：
  ```
  git fetch origin
  git checkout origin/fix/editor-function -b fix/editor-observability
  ```
- 分支只允许出现以下两类改动：
  1. 新增 `lib/observability/log-stage.ts`
  2. 修改 `app/api/analyze-image/route.ts` 来调用新 helper

## 2. 必须实现的 API

文件：`lib/observability/log-stage.ts`（新建）

```ts
export type Stage = "upload" | "mask" | "process" | "analyze" | "inpaint" | "composite" | "fusion" | "result"
export type Mode = "ai" | "composite"
export type Level = "info" | "warn" | "error"

export interface StageEvent {
  requestId: string
  stage: Stage
  mode?: Mode
  provider?: string          // e.g. "google", "openrouter", "replicate"
  model?: string             // e.g. "gemini-2.5-flash-image"
  input_meta?: { width?: number; height?: number; bytes?: number }
  elapsed_ms?: number
  error_code?: string        // e.g. "HTTP_404", "QUOTA_EXCEEDED"
  fallback_from?: string
  fallback_to?: string
  message?: string           // 自由文本，仅辅助
}

export function logStageEvent(level: Level, event: StageEvent): void
export function newRequestId(): string  // 形如 req_<timestamp>_<rand6>
```

实现要求：
- `logStageEvent` 必须输出**单行 JSON**（可被 Vercel logs grep）。前缀格式：`[stage:<stage>] <JSON>`
- `level` 决定走 `console.info / warn / error`
- 不允许引入新依赖（不要装 winston / pino）
- 不允许吞错：所有字段都是可选的，但 `requestId` + `stage` 是必填，缺失要 throw

## 3. analyze-image 接入点

文件：`app/api/analyze-image/route.ts`

需要打点的位置（**不要改业务逻辑，只加日志**）：

| 位置 | level | stage | 关键字段 |
|---|---|---|---|
| 路由入口 | info | analyze | requestId, mode, input_meta（图宽高和字节）|
| Google direct 成功 | info | analyze | provider=google, model, elapsed_ms |
| Google direct 失败 | warn | analyze | provider=google, error_code（如 `HTTP_429`）, fallback_from=google, fallback_to=openrouter |
| OpenRouter 成功 | info | analyze | provider=openrouter, model, elapsed_ms |
| OpenRouter 失败 | error | analyze | provider=openrouter, error_code |
| 全部失败返回 502 | error | analyze | error_code=ALL_PROVIDERS_FAILED |

`requestId` 在路由入口生成一次，之后所有打点共用同一个。

## 4. 不准做

- ❌ 改 `app/api/inpaint/route.ts` 或 `app/api/fusion/route.ts`（那是另一个同事的下一步任务，会冲突）
- ❌ 改 fallback 链路本身（只加日志，不改顺序、不加 retry）
- ❌ 改 `meta` 返回结构（那是面向前端的 API contract，单独 PR 处理）
- ❌ 装新依赖

## 5. 自测清单

合 PR 之前必须本地跑过：

1. `npm run build` 通过
2. `npm run dev` 起服务，跑 `docs/regression-cases.md` 的 **R-001、R-006、R-008** 三条
3. 手工 grep Vercel-style 日志，确认每条 R 用例都能在日志里看到至少 3 条 `[stage:analyze]` 打点
4. 故意把 `GOOGLE_API_KEY` 设错触发 R-006，确认日志里能看到 `fallback_from=google fallback_to=openrouter` 字段

## 6. PR 模板（强制字段，缺字段会被审查打回）

提交标题：`[fix/editor-observability] add logStageEvent helper, instrument analyze-image`

PR target 分支：`fix/editor-function`（不是 main）

PR 描述必须包含：

```markdown
## 修复前错误码
N/A（这是横切基础设施任务，不修具体 bug）

## 修复后行为
- 新增 lib/observability/log-stage.ts
- analyze-image 路由产出结构化 stage 日志
- 日志字段符合 docs/EDITOR_INCIDENT_RESPONSE 手册 §4 要求

## 覆盖回归用例 ID
- R-001（主链日志可见）
- R-006（fallback 字段正确）
- R-008（429 时 error_code=QUOTA_EXCEEDED）

## 是否新增降级逻辑
否（只加日志，不改 fallback 拓扑）

## 关键日志样例
（粘贴 3 条真实跑出来的日志行）
```

## 7. 时间预算

- 编码：~2h
- 自测：~1h
- 合理上限：半个工作日

如超时，先把 helper 部分的 PR 提了，analyze-image 接入拆成第二个 PR。
