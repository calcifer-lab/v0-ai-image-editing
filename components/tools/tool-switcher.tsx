"use client";

import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toolCatalog } from "@/lib/tools/catalog";
import { useState, type MouseEvent } from "react";

export default function ToolSwitcher({ current, onNavigate, disabled = false }: {
  current?: "reference-patch" | "diagram-revision";
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.(event);
    setOpen(false);
  }
  if (process.env.NODE_ENV !== "development") return null;
  const currentTool = toolCatalog.find((tool) => tool.id === current);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} aria-label={`Switch tools${currentTool ? `. Current: ${currentTool.title}` : ""}`}>
          Tools <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" lang="en">
        <DropdownMenuLabel>ReDiagram tools</DropdownMenuLabel>
        {toolCatalog.map((tool) => (
          <DropdownMenuItem key={tool.id} asChild disabled={current === tool.id}>
            <Link href={tool.href} aria-current={current === tool.id ? "page" : undefined}
              onClick={navigate} className="items-start py-3">
              <span className="flex-1">
                <span className="block font-medium">{tool.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {tool.id === "reference-patch" ? "Replace a region with a reference image" : "Review candidates and accept selected changes"}
                </span>
                {tool.id === "diagram-revision" && <span className="mt-1 block text-xs text-muted-foreground">Local preview</span>}
              </span>
              {current === tool.id && <><Check className="mt-0.5 h-4 w-4" aria-hidden="true" /><span className="sr-only">Current tool</span></>}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/lab/tools" onClick={navigate}>All tools and guides →</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
