import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Lightweight page view tracking endpoint
// Called from the client-side tracker on page navigation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "/"
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null

    // Extract country from request headers (Vercel provides this)
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null

    const supabase = await createClient()
    const { error } = await supabase.from("page_views").insert({
      path,
      referrer,
      country,
      user_agent: userAgent,
      session_id: sessionId,
    })

    if (error) {
      console.error("[track] insert error:", error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[track] error:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
