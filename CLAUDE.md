# Repo conventions

## Pull request rules

### Title format

`[function][模块] 描述`

- `function`: 改动类型（如 `feat`、`fix`、`refactor`、`chore`、`docs`、`perf`、`test`）。
- `模块`: 受影响的模块/页面/包名（如 `editor`、`layout`、`api/clarity`）。
- `描述`: 简短中文或英文说明，<= 70 字符。

示例: `[feat][layout] 集成 Microsoft Clarity 埋点`

### Required PR body sections

每个 PR 描述必须按下列顺序包含这四个小节，没有的写 "无" 或 "N/A"，不得省略标题：

1. **修复前错误码 / 现象**: 修复前的错误码、报错信息或可观察现象（新功能写 "无"）。
2. **修复后行为**: 修复 / 新功能落地后的预期行为，最好可被验证。
3. **覆盖回归用例**: 列出新增或已有的测试用例 / 手测步骤，覆盖此次改动与相关回归路径。
4. **降级逻辑与日志字段**: 是否引入降级 / 兜底分支；如有，列出新增或修改的日志字段名与触发条件。无则写 "无新增"。

### Notes

- 不要把 secrets / 项目 ID 写进 PR 描述；环境变量名可以提，值不要提。
- 部署相关的环境变量变更，单独在 PR 描述末尾用 "Deployment notes" 小节说明。
