"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function useToolNavigation(warning?: string) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  function onNavigate(event: MouseEvent<HTMLAnchorElement>) {
    // Modified clicks open another tab without discarding this workspace.
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || !warning) return;
    event.preventDefault();
    setDestination(event.currentTarget.getAttribute("href"));
  }
  const leaveDialog = (
    <Dialog open={!!destination} onOpenChange={(open) => { if (!open) setDestination(null); }}>
      <DialogContent lang="en">
        <div className="space-y-3">
          <DialogTitle>Leave this workspace?</DialogTitle>
          <DialogDescription>{warning}</DialogDescription>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDestination(null)}>Stay here</Button>
          <Button onClick={() => { if (destination) router.push(destination); setDestination(null); }}>Leave workspace</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  return { onNavigate, leaveDialog };
}
