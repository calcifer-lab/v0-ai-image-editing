"use client"

import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnv } from "./env"

// Browser-side Supabase client. Used from Client Components that need to
// trigger sign-in / sign-out interactively (Modal, Dropdown). Returns null
// when env is missing so the UI can degrade gracefully — same pattern the
// server client + middleware already use.
export function createClient() {
  const env = getSupabaseEnv()
  if (!env) return null
  return createBrowserClient(env.url, env.anonKey)
}
