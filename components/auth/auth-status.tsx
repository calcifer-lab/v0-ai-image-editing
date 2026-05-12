import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { signOut } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseEnv } from "@/lib/supabase/env"

type Variant = "site" | "editor"

// Server component. Reads the current user via SSR Supabase client and
// renders either a Sign-in link or the signed-in identity + Sign-out form.
export default async function AuthStatus({
  variant = "site",
}: {
  variant?: Variant
}) {
  if (!getSupabaseEnv()) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return variant === "site" ? (
      <Link href="/login" className="site-nav-link">
        <span className="lang-en">Sign in</span>
        <span className="lang-zh">登录</span>
      </Link>
    ) : (
      <Link
        href="/login"
        className="text-sm font-medium text-foreground hover:text-primary"
      >
        Sign in
      </Link>
    )
  }

  return <SignedInMenu user={user} variant={variant} />
}

function SignedInMenu({ user, variant }: { user: User; variant: Variant }) {
  const label = displayName(user)

  if (variant === "site") {
    return (
      <form action={signOut} className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline" title={user.email ?? undefined}>
          {label}
        </span>
        <button type="submit" className="site-nav-link">
          <span className="lang-en">Sign out</span>
          <span className="lang-zh">退出</span>
        </button>
      </form>
    )
  }

  return (
    <form action={signOut} className="flex items-center gap-3">
      <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:inline" title={user.email ?? undefined}>
        {label}
      </span>
      <button
        type="submit"
        className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary"
      >
        Sign out
      </button>
    </form>
  )
}

function displayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | null | undefined
  const name = typeof meta?.full_name === "string" ? meta.full_name : null
  return name ?? user.email ?? "Signed in"
}
