import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseEnv } from "./env"

// Server-side Supabase client. Use from Server Components, Route Handlers,
// and Server Actions. Reads / writes the session cookie via next/headers.
export async function createClient() {
  const env = getSupabaseEnv()
  if (!env) {
    throw new Error(
      "Supabase env not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — middleware will refresh cookies on
          // the next request, so silently ignore is the documented pattern.
        }
      },
    },
  })
}
