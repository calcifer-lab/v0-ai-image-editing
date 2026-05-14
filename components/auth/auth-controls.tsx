import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseEnv } from "@/lib/supabase/env"
import SignInTrigger from "./sign-in-trigger"
import UserDropdown from "./user-dropdown"

type Variant = "site" | "editor"

// Preview-only mock user. Paired with NEXT_PUBLIC_SKIP_AUTH=true in the
// middleware so feature-branch previews render as a signed-in tester.
const PREVIEW_MOCK_USER = {
  id: "test-user",
  email: "preview@test.com",
  user_metadata: { full_name: "Preview Tester" },
} as unknown as User

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
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    return <UserDropdown user={PREVIEW_MOCK_USER} />
  }

  if (!getSupabaseEnv()) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <SignInTrigger variant={variant} />
  return <UserDropdown user={user} />
}
