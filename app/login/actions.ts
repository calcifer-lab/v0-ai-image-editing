"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

type OAuthProvider = "google" | "github"

function isOAuthProvider(value: unknown): value is OAuthProvider {
  return value === "google" || value === "github"
}

// Only allow internal paths so a crafted ?next= can't punt the user off-site
function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/editor"
  if (!value.startsWith("/") || value.startsWith("//")) return "/editor"
  return value
}

export async function signInWithOAuth(formData: FormData) {
  const provider = formData.get("provider")
  if (!isOAuthProvider(provider)) {
    redirect("/login?error=unsupported_provider")
  }

  const next = safeNext(formData.get("next"))
  const supabase = await createClient()

  const headerList = await headers()
  // Prefer x-forwarded-host (Vercel / proxy) over host so the callback URL
  // matches the registered redirect in the OAuth provider.
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  const origin = host ? `${proto}://${host}` : ""

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_init_failed")}`)
  }

  redirect(data.url)
}
