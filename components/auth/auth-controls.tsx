import { createClient } from "@/lib/supabase/server"
import { getSupabaseEnv } from "@/lib/supabase/env"
import SignInTrigger from "./sign-in-trigger"
import UserDropdown from "./user-dropdown"

type Variant = "site" | "editor"

// Server Component. Reads the current user via SSR Supabase client and hands
// off to Client Components for the interactive Modal / Dropdown UX.
//
// Degrades to null when Supabase env isn't configured — same contract as the
// middleware and the previous AuthStatus, so the rest of the page stays sane
// during initial setup.
export default async function AuthControls({
  variant = "site",
}: {
  variant?: Variant
}) {
  if (!getSupabaseEnv()) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <SignInTrigger variant={variant} />
  return <UserDropdown user={user} />
}
