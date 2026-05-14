import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Preview-only escape hatch: NEXT_PUBLIC_SKIP_AUTH=true bypasses Supabase
  // session gating so feature-branch previews can hit /editor without login.
  // MUST NOT be set in Production.
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on every request except Next internals + static assets.
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
