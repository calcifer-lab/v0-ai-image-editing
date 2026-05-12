import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// OAuth provider redirects here with ?code=... after the user grants access.
// We exchange the code for a session (which sets the auth cookie via the
// SSR client) and then redirect onward to the intended page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const errorParam = searchParams.get("error_description") || searchParams.get("error")
  const nextParam = searchParams.get("next") || "/editor"
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/editor"

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
