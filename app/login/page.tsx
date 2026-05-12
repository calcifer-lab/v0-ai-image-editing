import Link from "next/link"
import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { signInWithOAuth } from "./actions"
import { getSupabaseEnv } from "@/lib/supabase/env"

export const metadata: Metadata = {
  title: "Sign in — ReDiagram",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const nextParam = typeof sp.next === "string" ? sp.next : "/editor"
  const errorParam = typeof sp.error === "string" ? sp.error : null
  const configured = !!getSupabaseEnv()

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-6 py-12">
      <Card className="w-full max-w-md space-y-6 p-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Sign in to ReDiagram</h1>
          <p className="text-sm text-muted-foreground">
            Continue with your Google or GitHub account to access the editor.
          </p>
        </header>

        {errorParam && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Sign-in failed: {errorParam}
          </div>
        )}

        {!configured && (
          <div
            role="alert"
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Supabase isn&apos;t configured yet. Set{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in the
            deployment environment.
          </div>
        )}

        <form action={signInWithOAuth} className="space-y-3">
          <input type="hidden" name="next" value={nextParam} />
          <button
            type="submit"
            name="provider"
            value="google"
            disabled={!configured}
            className="flex w-full items-center justify-center gap-3 rounded-md border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </button>
          <button
            type="submit"
            name="provider"
            value="github"
            disabled={!configured}
            className="flex w-full items-center justify-center gap-3 rounded-md border bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitHubIcon className="h-5 w-5" />
            Continue with GitHub
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </Card>
    </main>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-1.92c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .97-.31 3.18 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.57.23 2.73.12 3.02.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.39-5.26 5.68.41.36.78 1.05.78 2.12v3.14c0 .31.21.66.8.55C20.22 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}
