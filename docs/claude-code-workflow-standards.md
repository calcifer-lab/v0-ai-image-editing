# ReDiagram Fix · Claude Code 工作规范手册

> 适用阶段：MVP 功能完成后，面向市场推广验证阶段
> 工作模式：Claude Code 单人执行，Calcifer 审核后合并 main
> 文档版本：v1.0 · 2026-05

---

## 一、整体原则

**四不原则**

1. **不直接提交 main**：所有工作在分支上完成，经 Calcifer 审核通过后才合并。
2. **不顺手扩散**：一个分支只做一件事，发现新问题登记任务，不在当前分支捎带处理。
3. **不猜测产品逻辑**：已钉死的文案、品牌决策、用户动作词，代码原样落地，不自行解释或替换。
4. **不跳过自检**：每个分支提交前必须完成构建验证和自检清单，再请求审核。

---

## 二、分支策略

### 2.1 命名规范

```
main                          ← 生产分支，只接受 Calcifer 审核通过的 PR
feat/<scope>-<brief>          ← 新功能 / 新区块
fix/<scope>-<brief>           ← Bug 修复 / 交互优化
chore/<scope>-<brief>         ← 配置、文案替换、依赖更新、非功能性改动
```

`<scope>` 对应页面/模块区块：

| scope | 含义 |
|---|---|
| `hero` | Hero 区（主标题、动画、CTA） |
| `whofor` | Who it's for 卡片区 |
| `howitworks` | How it works 三步区 |
| `faq` | FAQ 区 |
| `footer` | Footer 区 |
| `progress` | Fix 进度条 / 处理中 UI |
| `auth` | 登录 / 注册流 |
| `credits` | 积分系统 UI |
| `global` | 全局样式、字体、色板、组件库 |
| `infra` | 构建、部署、环境配置 |

**示例：**

```
feat/hero-video-embed
fix/progress-hide-stage-steps
chore/whofor-copy-update
fix/footer-dynamic-year
chore/global-replace-emoji-icons
```

### 2.2 生命周期（强制）

```
1. 从 main 拉出分支
2. 开发 → 自检 → 构建验证
3. 提 PR，填写 PR 模板
4. 等待 Calcifer 审核
5. 审核通过 → squash merge 进 main
6. 删除分支
```

> **禁止**：跨分支 cherry-pick 未经审核的代码；禁止 force push main。

---

## 三、当前任务优先级队列

> 按"推广验证所需"排序，每次开工前与 Calcifer 确认当前 TOP 任务。

### 第一批（上线前必做）

| 优先级 | 任务描述 | scope | 分支名建议 | 备注 |
|---|---|---|---|---|
| P0 | Fix 进度中：隐藏各阶段步骤明细，只保留总进度条 | `progress` | `fix/progress-hide-stage-steps` | 见第四章详细规范 |
| P0 | 替换首页所有文案为定稿版本 | `hero` `whofor` `howitworks` `faq` `footer` | 按区块分批开分支 | 对照《首页定稿.md》逐区块核对 |
| P0 | 品牌名全局替换：ReDiagram AI → ReDiagram | `global` | `chore/global-brand-rename` | 包括 `<title>`、meta、logo alt |
| P1 | Footer 年份改为动态 `new Date().getFullYear()` | `footer` | `fix/footer-dynamic-year` | |
| P1 | 全局替换 emoji 为 Lucide/Phosphor 线条图标 | `global` | `chore/global-replace-emoji-icons` | |
| P1 | 配置域名邮箱 hello@rediagram.com 并更新 footer | `footer` | `chore/footer-email-update` | |
| P2 | Termly 隐私政策 + 服务条款页面接入 | `infra` | `chore/infra-legal-pages` | |

### 第二批（推广运营所需）

| 优先级 | 任务描述 | scope |
|---|---|---|
| P2 | Hero 视频嵌入（MP4, `<video autoplay loop muted playsinline>`） | `hero` |
| P2 | Who it's for 卡片 Before/After 滑动对比组件 | `whofor` |
| P2 | How it works 三步示意插图接入 | `howitworks` |
| P3 | About 页面 | 新建 `about` scope |

---

## 四、Fix 进度条交互规范（重点章节）

> 本章对应任务 `fix/progress-hide-stage-steps`，是 MVP 后第一个 UI 优化项。

### 4.1 改动目标

**现状**：Fix 处理中 UI 显示各阶段步骤名称和状态（如 upload → mask → process → inpaint → fusion），用户看到内部流程明细，产生困惑。

**目标**：只保留一条总进度条 + 一句简短状态语，不暴露内部 stage 细节。

### 4.2 UI 规范

```
┌─────────────────────────────────────┐
│                                     │
│   [Fix 按钮：Fixing…]                │
│                                     │
│   ─────────●──────────────          │  ← pill 进度条 + 微光带 shimmer
│                                     │
│       Fixing… · ~12s left           │  ← 居中单行：状态 + 预计剩余时间
│                                     │
└─────────────────────────────────────┘
```

**状态文案规则**（统一一句，不分阶段）：

| 状态 | 显示文案（EN） | 显示文案（中） |
|---|---|---|
| 处理中（0–99%） | Fixing… | 修复中… |
| 完成（100%） | 自动淡出，不另显文字 | 自动淡出，不另显文字 |

> Fix 按钮在空闲态显示 `FIX`，处理中显示 `Fixing…`（带动态省略号），始终只有一句话，不暴露 stage。

**进度条与 ETA 视觉规范**：

- pill 形状（高度 6px，圆角 999px），轨道用 `primary` 10% 透明叠色
- 填充使用 `var(--primary)` 实色，由 `requestAnimationFrame` 逐帧推进；**单调递增、永不回退**（真实事件只会抬高目标位，不会下拉显示位）
- 推进逻辑：`velocity = max(gap*0.18, (99-current)*0.04, 0.15) %/sec`，即使后端长时间无事件，进度条也按渐近曲线持续爬升，避免"卡住像死机"的错觉
- 进度位上限锁定在 **99%**，只有最终结果就绪才允许冲到 100，避免提前到顶
- 填充层叠加 1.6s 线性 shimmer 光带（白色 55% 透明横向 sweep），强化"还在工作中"的视觉信号
- 不显示百分比数字；屏幕阅读器通过 `role="status"` + `aria-label="Fixing, X percent, ~Ys left"` 获取详情

**ETA（预计剩余时间）规则**：

进度有两个内部状态，必须分开：

- `progressTargetRef`：含 `driftTo`，给进度条爬升用（让条始终在动）
- `progressRealRef`：**只跟真实 `progress`，不吃 `driftTo`**，专门给 ETA 算

为什么必须分开：`updateProgress("...", 48, { driftTo: 80 })` 之类的事件一次会把 target 顶到 80，但实际工作只到 48；若 ETA 用 target，分母骤增 → ETA 突跳（用户能看到"~21s 突然变 ~6s"）。

- 估算公式：`rawEta = elapsed * (100 - real) / real`
- 出现条件：`real >= 4%` 且已运行 `>= 1.2s`
- **均匀倒数 + 一阶低通追赶**（这是 ETA 体验的关键）：
  - 每帧先做 `tickedDown = max(0, prev - dt)` —— 保证倒计时永远以 1s/s 均匀走
  - 若 `rawEta < tickedDown`（新估算更短）：用 `tau = 3s` 一阶低通 slide 追赶过去，绝不突跳
  - 若 `rawEta >= tickedDown`（新估算更长）：保持 tickedDown，禁止 ETA 上抬
- 软地板：`real < 99` 时 ETA 不低于 2s，避免提前显示 `0s left`
- 文案格式：`~Ns left`（< 60s）/ `~Nm left`（>= 60s）/ 不显示（无估算）。**禁止 "almost done"**：在 stage 卡住时会停留过久误导用户

**禁止出现在 UI 上的内容**：

- stage 名称：upload / mask / process / analyze / inpaint / composite / fusion / result
- 百分比数字（除非后续产品决策开启）、requestId、model 名、elapsed_ms 等技术参数
- 错误堆栈（用户侧只允许出现友好错误文案，详见 4.3）

### 4.3 错误态规范

当后端返回错误时，UI 只显示：

```
Something went wrong. Please try again.
如果问题持续，请联系 hello@rediagram.com
```

**不得**展示错误码、HTTP 状态码或 stage 级别的失败信息。错误日志留在控制台，不渗入界面。

### 4.4 进度推进逻辑

后端进度若为非线性（分 stage 上报），前端需做平滑处理：

```typescript
// 推荐：将后端 stage 进度映射为前端总进度，禁止直接透传
const STAGE_PROGRESS_MAP: Record<string, number> = {
  upload:    10,
  mask:      20,
  process:   40,
  analyze:   55,
  inpaint:   70,
  composite: 85,
  fusion:    95,
  result:   100,
}
// 前端只用总百分比更新进度条，不渲染 stage 名
```

---

## 五、文案改动操作规范

> 适用于所有 `chore/<scope>-copy-update` 类分支。

### 5.1 核对来源

**唯一权威来源**：`ReDiagram-Fix-首页定稿.md`（Claude Project Knowledge）

文案改动必须做到字段对字段核对，不得意译或"更顺口地改一改"。若发现定稿与现有代码存在歧义，先暂停，向 Calcifer 确认，不自行决断。

### 5.2 双语对照规则

- 中英文版本必须同步落地，不允许只改一个语种。
- 若页面当前只有单语，在 PR 描述中注明，等待 Calcifer 决策是否补全。

### 5.3 已钉死的核心文案（代码中不得改动）

| 字段 | 内容 |
|---|---|
| 品牌 slogan（EN） | Keep what works. Change only what needs to. |
| 品牌 slogan（中） | 保留对的，只改要改的。 |
| Hero 主标题（EN） | Keep the 90% AI got right. Compose the 10% it didn't. |
| Hero 主标题（中） | 把 AI 画对的部分留下，画崩的部分换掉。 |
| 产品名 | ReDiagram Fix |
| 公司名 | ReDiagram |
| 用户动作词 | Fix / 修 |
| 品牌动作词 | Compose / 合成 |

---

## 六、代码改动边界

### 6.1 文件归属建议

| 文件/目录 | 归属 scope |
|---|---|
| `components/progress*` / `components/fix-status*` | `progress` |
| `components/hero*` | `hero` |
| `components/who-for*` / `components/scene-card*` | `whofor` |
| `components/how-it-works*` | `howitworks` |
| `components/faq*` | `faq` |
| `components/footer*` | `footer` |
| `app/api/*` | 对应功能 scope，改前声明 |
| `lib/*` / `utils/*` | `global`，改前声明 |
| `public/videos/*` | `hero` |
| `public/icons/*` | `global` |

### 6.2 改动前规则

- 在分支首次 commit 的 message 里写明：改哪些文件、为什么。
- 若改动会触达共用 hook 或工具函数（如进度管理、图片上传），在 PR 描述中单独列出影响范围。

### 6.3 改动后规则

提交前必须完成：

```bash
npm run build          # 构建无报错
npm run lint           # 无新增 lint 错误
```

---

## 七、PR 模板（强制字段）

每个 PR 必须包含以下内容（复制模板填写）：

```markdown
## 改动类型
- [ ] feat（新功能）
- [ ] fix（Bug 修复 / 交互优化）
- [ ] chore（配置 / 文案 / 非功能性）

## 改动范围
scope: <hero / progress / whofor / ...>

## 做了什么
<!-- 一两句话说清楚，不需要长篇大论 -->

## 改动前 vs 改动后
<!-- 如有 UI 变化，附截图或录屏 -->

## 已钉死文案是否核对
- [ ] 对照《首页定稿.md》核对，无自行改动

## 构建验证
- [ ] npm run build 通过
- [ ] npm run lint 无新增报错

## 需要 Calcifer 特别注意的地方
<!-- 若无，填"无" -->
```

**PR 标题格式**：

```
[scope] 动作描述
```

示例：

```
[progress] 隐藏 stage 步骤，只保留总进度条
[chore] 全局替换品牌名 ReDiagram AI → ReDiagram
[hero] 嵌入首屏循环视频（太空+烤架场景）
```

---

## 八、自检清单（提 PR 前必过）

```
□ 分支从 main 拉出（不是从其他未合并分支拉出）
□ 只做了分支名对应的那一件事，没有顺手改其他
□ 已钉死文案未被自行修改
□ 中英文文案同步落地（或在 PR 中注明待决策）
□ progress UI 未暴露任何 stage 内部信息（适用于 progress scope）
□ npm run build 通过
□ npm run lint 无新增报错
□ PR 模板所有字段已填写
□ 有 UI 变化的已附截图或录屏
```

---

## 九、沟通与审核节奏

- **提 PR 后**：通知 Calcifer，等待审核，不自行合并。
- **审核意见**：按意见修改后在同一分支追加 commit，不重开分支。
- **遇到产品逻辑疑问**：先暂停，问清楚再动手。不猜，不自行决断。
- **发现新问题**：登记为新任务（可写在飞书/备忘录），新开分支处理，不在当前分支捎带。

---

## 十、禁止事项速查

| 禁止 | 原因 |
|---|---|
| 直接 push / commit 到 main | 跳过审核，风险不可控 |
| 一个分支做多件事 | 审核困难，回滚代价高 |
| 自行改动已钉死文案 | 品牌一致性红线 |
| 在进度 UI 暴露 stage 名称 | 用户体验规范，见第四章 |
| 在用户界面显示错误堆栈 | 用户体验红线 |
| 跳过 build / lint 直接提 PR | 质量门控 |
| 使用未经确认的第三方依赖 | 需先与 Calcifer 确认再引入 |

---

*文档版本：v1.0*
*最后更新：2026-05*
*适用项目：ReDiagram Fix · 推广验证阶段*
