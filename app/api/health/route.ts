import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Lightweight health check — keeps Supabase warm by triggering a simple query.
// Designed to be pinged by a cron job every few hours.
export async function GET() {
  try {
    const supabase = await createClient()
    await supabase.auth.getUser()

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
