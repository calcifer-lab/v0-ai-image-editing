// Add tools here without replacing existing routes or merging editor state.
export const toolCatalog = [
  {
    id: "reference-patch",
    title: "Fix",
    href: "/editor",
    tag: "Reference Patch · Existing tool",
    description:
      "Replace a selected area with content from a reference image using Direct Patch.",
  },
  {
    id: "diagram-revision",
    title: "Diagram Revision",
    href: "/lab/revisions",
    tag: "New tool · Local preview",
    description:
      "Refine text, colors, and connections. Review candidates, accept selected changes, and return to saved projects.",
  },
] as const;
