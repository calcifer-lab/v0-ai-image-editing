# 2026-11-03：独立工具矩阵与连续修订

## 产品结构

本地入口 `/lab/tools`：参考图替换仍进入原有 `/editor`；图解连续修订进入 `/lab/revisions`。未修改首页、原编辑器组件或其交互流程。工具卡片由 `lib/tools/catalog.ts` 统一登记，新增工具增加独立路由和独立数据命名空间，不用覆盖原功能。当前入口与新接口均仅 development 开放。

## 本轮落地

- 当前图可先画选区，再输入修改要求。新增独立 `/api/lab/revisions` 接口；生成候选不直接覆盖当前版本，失败不回退成假成功。
- IndexedDB 独立数据库 `rediagram-revision-projects` 自动保存已采纳版本，关闭/刷新后从最近项目恢复；保留文件导出方式。列表展示最近 5 项，其余记录没有自动删除。未采纳候选、选区和输入草稿不自动保存。浏览器清理存储会丢失本机项目，长期保存请导出。
- 候选与当前图可用差值叠加检查；只是视觉差值，不等于语义错误检查。支持 150%/200% 放大和滚动、选区坐标与大小调整。
- 维持多矩形选择、尺寸不一致必须确认、局部采纳、版本分支与 PNG 导出。

## 模型配置与限制

沿用仓库的 Google 服务端 HTTP 调用方式，不新增 SDK 依赖；只给共享调用函数添加可选 AbortSignal，原调用默认行为不变。

网页端需要本地服务端环境变量 `GOOGLE_API_KEY`（也支持 `GEMINI_API_KEY`），可选 `REVISION_IMAGE_MODEL`，默认 `gemini-3-pro-image`。按 [Google 官方图像文档](https://ai.google.dev/gemini-api/docs/image-generation) 核对型号。密钥不得放入 NEXT_PUBLIC 变量。未配置时按钮禁用、同源 POST 返回明确错误。

Codex 内置图像工具不是网页可调用的服务端 API。本轮未配置凭证，**没有完成真实在线生成的端到端试验**。实现了接入路径、失败处理与模拟服务返回的单元测试，不将其表述为真实模型生成成功。已存在的演示候选仍为上一轮内置工具实测输出。

接口只接受本机 3100 端口同源请求，限制单实例同时一个生成任务，120 秒超时，不自动重试收费调用；尚不具备生产计费、分布式限流和多用户鉴权，因此保持生产关闭。

## 验证

- 核心及服务端调用单元测试 7/7：区域保护、重叠区域、非法输入、连续采纳不回退、细微像素差、输入图片/取消信号传递、服务失败/无图不伪造成功。
- 新增工具、接口与组件的 scoped TypeScript 检查通过。
- Webpack 整站生产构建通过；原配置仍跳过全仓类型检查，原三处错误不在本轮修复范围。
- 浏览器验证：工具箱独立入口、打开修订工具、自动保存完成、关闭、刷新、最近项目恢复；无候选时可先手动框选，出现正确坐标编辑框。
- 本地 HTTP 验证：未配置状态、同源未配置错误、跨来源拒绝。修复 Next.js 本地内部 URL 与 Host 不同导致的同源误拒绝。

## 仍需验证

真实模型返回的成功/超时交互、复杂中文/回环图的交付耗时、多标签同时编辑同一项目的冲突处理、持久存储配额压力。当前同一项目多标签为最后写入生效。20 张真实图的对照评测和付费验证仍未完成。

未发起 PR，未推送，未部署线上。

## UI 统一补充

新工具箱与修订页共用 ToolHeader，直接复用首页 BrandMark 和 brand-lockup / brand-text 样式。新页面使用首页的背景、文本、边框和主按钮设计变量，删除原先独立的绿色配色与字体覆盖。卡片、输入框和焦点状态也做了统一。未修改 app/globals.css、首页或原 editor 的任何组件；原 editor 界面保持不动。已通过新模块类型检查及浏览器视觉检查，截图为 toolbox-brand-preview.png、revision-brand-preview.png。

## 英文优先与 SEO 内容补充

新工具导航、按钮、状态、报错、示例任务均改为英文；新页面声明 lang=en。用户已保存的项目名称不强制翻译，原 editor 的界面及语言机制不变。新增三篇英文操作指南和配图，文章页复用首页 Logo，接入对应工具 CTA。修订实验文章只在开发环境展示且 noindex，不进入 sitemap；详见 SEO-CONTENT-PLAN.md。

## 首页入口整合（2026-11-03）

本地首页首屏增加 Explore tools 主入口，进入 /lab/tools；Try Fix 保持直达 /editor，顶部与原案例中的 Try Fix 仍是原功能快捷入口。首页 Hero 后增加两个并列卡片，与工具箱共用 ToolCards 和 catalog。原工具以 Fix 为名称、Reference Patch 为用途说明；新工具仍为 Diagram Revision。博客导航也增加本地 Tools 入口。

新入口只在 development 展示，生产首页维持原入口，避免将访客导向仍未发布的 lab。未来发布时需要随正式工具路由一起解除预览条件。原 editor 组件、UI 和工作流均未修改。

验证：浏览器完成首页 Explore tools → 工具箱 → Fix → 原 /editor 的导航；检查首页英文双入口显示并保存 home-entry-preview.png。相关模块 TypeScript 检查及生产 Webpack 构建通过；解析生产首页与博客 HTML，确认仍含 /editor 且没有 /lab/ 链接。构建仍沿用仓库既有的全仓类型跳过配置。

## 工具内双向切换（2026-11-03）

Fix 顶栏加入 Tools 菜单，Diagram Revision 使用同一个 ToolSwitcher。菜单读取现有 catalog，展示用途、当前工具勾选、新工具预览标记及 All tools and guides。Fix 的上传、选区、参数、结果区与处理逻辑保持原样；顶栏在窄窗口可换行，避免按钮挤压。

切换通过共享 useToolNavigation 提供站内离开对话框。Fix 检查上传页局部草稿和编辑/结果状态，明确告知不自动保存；执行生成时工具菜单禁用。修订页检查未保存项目、候选、输入草稿、选区及忙碌状态。Stay here 保留页面状态，Leave workspace 才导航；修订页 Logo 和 Guides 链接也使用该检查。新标签打开不离开当前工作区。该检查针对接入的站内链接，不代表已完成全站刷新/浏览器后退拦截或跨工具自动传图。

浏览器验证：空白 Fix → Diagram Revision；修订页输入草稿 → 切换提示 → Stay here 后草稿保留；确认 Leave workspace → Fix；Fix 加载内置样例进入编辑 → 切换提示 → Stay here 后仍在编辑。测试样例已通过 Start New 清理，未执行付费生成。截图 fix-tool-switcher-preview.png。

新模块 scoped 类型检查与 Webpack 生产构建通过。全仓 tsc 仍只有已有的三处问题（两处 AuthControls async JSX、一处 ResultsView ref），本次没有新增错误。工具菜单仍仅在 development 展示，未发布到线上。
