// Centralized env access for Supabase. Keeps the "is Supabase configured?" check
// in one place so middleware / login page can degrade gracefully when envs are
// missing during initial setup, instead of crashing every request.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey }
}
