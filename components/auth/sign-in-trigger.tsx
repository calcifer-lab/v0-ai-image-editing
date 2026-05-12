"use client"

import { useState } from "react"

import AuthModal from "./auth-modal"
import { cn } from "@/lib/utils"

interface SignInTriggerProps {
  variant?: "site" | "editor"
}

export default function SignInTrigger({ variant = "site" }: SignInTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center rounded-full border border-black/25 bg-white px-3.5 py-1.5 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f7f7f5] hover:border-[#0a0a0a]",
          variant === "editor" && "text-xs px-3 py-1",
        )}
      >
        Sign in
      </button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  )
}
