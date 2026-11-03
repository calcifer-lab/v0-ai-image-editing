// Add tools here without replacing existing routes or merging editor state.
export const toolCatalog = [
  {
    id: "reference-patch",
    title: "参考图替换",
    href: "/editor",
    tag: "现有工具",
    description:
      "已有正确的素材或参考图，用 Direct Patch 替换指定区域。保持原有编辑流程。",
  },
  {
    id: "diagram-revision",
    title: "图解连续修订",
    href: "/lab/revisions",
    tag: "新工具 · 本地实验",
    description:
      "逐轮修改文字、颜色与关系，检查候选，局部采纳，保存项目并继续修订。",
  },
] as const;
