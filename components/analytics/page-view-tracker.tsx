"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Generate a simple session ID stored in sessionStorage
function getSessionId(): string {
  if (typeof window === "undefined") return ""
  const key = "rd_session_id"
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, id)
  }
  return id
}

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Skip tracking on API routes
    if (pathname.startsWith("/api/")) return

    const sessionId = getSessionId()
    const referrer = document.referrer || null

    // Fire and forget — don't block UI
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer, sessionId }),
    }).catch(() => {
      // Silent fail — tracking should never break the UI
    })
  }, [pathname])

  return null
}
