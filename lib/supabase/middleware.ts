import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnv } from "./env"

const PROTECTED_PREFIXES = ["/editor"]

// Per @supabase/ssr docs: middleware MUST call supabase.auth.getUser() so that
// the access token gets refreshed and the new cookies are written onto the
// outgoing response. Mutating supabaseResponse rather than returning a fresh
// one is intentional — required by the cookie-handoff pattern in their docs.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const env = getSupabaseEnv()
  if (!env) {
    // Supabase not configured yet — let the app keep working, just don't gate.
    return supabaseResponse
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Redirect away from /login if already signed in
  if (pathname === "/login" && user) {
    const next = request.nextUrl.searchParams.get("next") || "/editor"
    const url = request.nextUrl.clone()
    url.pathname = next.startsWith("/") ? next : "/editor"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
