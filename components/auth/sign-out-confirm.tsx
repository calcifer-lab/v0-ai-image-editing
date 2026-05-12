"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface SignOutConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SignOutConfirm({ open, onOpenChange }: SignOutConfirmProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Sign-out unavailable — Supabase not configured")
      return
    }
    setPending(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setPending(false)
      toast.error(error.message || "Sign-out failed")
      return
    }
    // Refresh so the server-rendered shell (header, /editor guard) picks up
    // the cleared session cookie. Then navigate home and close the dialog.
    onOpenChange(false)
    router.push("/")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent
        className="w-[92vw] max-w-[340px] p-6 sm:p-7 text-center gap-3"
        showClose={false}
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#c0362f]/20 bg-[#c0362f]/10">
          <LogOut className="h-5 w-5 text-[#c0362f]" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <DialogTitle className="text-base">Sign out?</DialogTitle>
          <DialogDescription>
            Your fixes and history are always saved. You can sign back in anytime.
          </DialogDescription>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f7f7f5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#c0362f] px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-70"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{pending ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
