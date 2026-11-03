# 本地修订实验室

> 2026-11-03 更新：已新增并列工具入口、已采纳版本自动保存和独立模型接口。当前状态请先阅读 [第二轮迭代](./ITERATION-2.md)。下文保留第一轮验证记录，未配置模型时仍可运行本地功能。

开发分支：`codex/diagram-revision-lab`。不需要任何 API key。仅 development 模式开放，生产模式已验证 `/lab/revisions` 返回 404。

## 运行

使用 Node 22.6+（测试依赖内置 TypeScript stripping），按现有锁文件安装依赖：

```sh
pnpm install --frozen-lockfile
pnpm dev:revision
```

打开 http://127.0.0.1:3100/lab/revisions 。如机器的 pnpm 自动依赖检查阻塞，可使用已安装的 `node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100`。

先点击“体验真实修图样例”，依次选择改时限、改配色、改关系。每轮候选尺寸不同，需要点击“确认按当前尺寸对齐”，再使用样例选区或拖动框选。预览后采纳，项目会添加新版本。也可导入自己的原图、完整候选图。

保存项目下载 JSON；下次“打开项目”可继续。PNG 导出只导出当前已采纳版本。关闭未保存项目会确认，浏览器关闭有离开提示。实验版没有自动保存，因此请导出项目。

## 证据与范围

- [研究与投入判断](./RESEARCH.md)
- [真实浏览器导出像素审计](./pixel-audit.json)
- [本地界面截图](./local-preview.png)
- `public/revision-lab/`：自制源图与 3 次内置图像工具原始结果。

原型不生成候选、不接 OpenAI/Gemini API；不提供原生 PPT 或矢量重建。与主编辑器隔离，尚未改变既有 Direct Patch 的行为。开发模式关闭原有 GA/Clarity/PageViewTracker，避免本地测试污染访问统计，生产行为保持原样。

限制：每图最多 4,194,304 像素，单个输入文件 24 MB；最多 12 版本、32 矩形选区，项目 JSON 最多 64 MB。只支持 PNG/JPEG/WebP；导出为 PNG。长宽比不匹配拒绝对齐。像素保证针对解码 RGBA 的复制操作；导出验证目前覆盖本样本的不透明 PNG，未完成全部浏览器和色彩配置的兼容性评测。

## 验证结果（2026-10-29）

| 检查 | 结果 |
| --- | --- |
| 新增核心单元测试 | 5/5：区域外 RGBA 不变、输入不变、重叠区、非法尺寸/区域、连续修订与小色差 |
| 新增模块类型检查 | `tsc -p tsconfig.revision-lab.json --noEmit` 通过 |
| 整站生产构建 | `next build --webpack` 通过；仓库原有配置跳过类型检查，不能视作整站类型通过 |
| 全仓类型检查 | 仍有原有 3 错：app/editor/page.tsx 与 components/landing/header.tsx 的异步 AuthControls 类型；components/results-view.tsx 的 ref 类型。上述文件未改动 |
| 浏览器主流程 | 三轮导入→尺寸拦截→确认对齐→选区→预览→采纳→V0–V3，成功 |
| 项目保存/重开 | 真实下载 JSON 后重新导入，恢复当前 V3 和全部历史，成功 |
| 版本恢复 | V3→V0→V3，历史保留，成功 |
| 真实导出像素检查 | 三轮选区外均 0 变化；`pixel-audit.json` |
| 手动框选/清空 | 鼠标拖动产生矩形选区，清空后采纳按钮禁用 |
| 异常项目导入 | 包含外部 URL 的项目被拒绝，显示“项目版本数据无效” |
| 生产隔离 | 本机 production 服务器 GET /lab/revisions → 404 |

初次 Turbopack 启动因本机 PATH 找不到子进程 node 失败；切换 Webpack 后正常。pnpm 安装已取得锁定依赖，但其构建脚本审批检查返回非零；实际 Sharp 转码、页面样式、Webpack 构建均成功，未放开全部安装脚本。锁文件未修改。

复验：

```sh
node --experimental-strip-types --test tests/revision-lab/*.test.mjs
node node_modules/typescript/bin/tsc -p tsconfig.revision-lab.json --noEmit
node scripts/audit-revision-project.mjs /path/to/rediagram.revision.json
```

像素审计脚本针对演示的标准三轮选区和四个版本；不是通用项目验证器。
