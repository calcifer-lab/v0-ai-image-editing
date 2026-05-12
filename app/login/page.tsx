import Link from "next/link"
import type { Metadata } from "next"
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
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6 py-12">
      <div className="w-full max-w-[368px] rounded-2xl border border-black/15 bg-white p-7 shadow-2xl sm:p-8">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0a0a0a] text-xs font-bold text-white">
            R
          </span>
          <span className="text-sm font-medium tracking-tight text-[#0a0a0a]">
            ReDiagram Fix
          </span>
        </div>

        <div className="mb-5 space-y-1.5">
          <h1 className="text-xl font-medium leading-tight tracking-tight text-[#0a0a0a]">
            Welcome back
          </h1>
          <p className="text-sm leading-relaxed text-[#6b6b68]">
            Sign in to your workspace. Your fixes and history will be waiting.
          </p>
        </div>

        {errorParam && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-[#c0362f]/30 bg-[#c0362f]/[0.07] px-3 py-2 text-xs text-[#c0362f]"
          >
            Sign-in failed: {errorParam}
          </div>
        )}

        {!configured && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          >
            Supabase isn&apos;t configured yet. Set{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </div>
        )}

        <form action={signInWithOAuth} className="space-y-2">
          <input type="hidden" name="next" value={nextParam} />
          <button
            type="submit"
            name="provider"
            value="google"
            disabled={!configured}
            className="flex w-full items-center gap-2.5 rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f7f7f5] hover:border-black/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border border-black/10 bg-white">
              <GoogleIcon />
            </span>
            Continue with Google
          </button>
          <button
            type="submit"
            name="provider"
            value="github"
            disabled={!configured}
            className="flex w-full items-center gap-2.5 rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f7f7f5] hover:border-black/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border border-black/10 bg-white">
              <GitHubIcon />
            </span>
            Continue with GitHub
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#a0a09c]">
          By signing in you agree to our{" "}
          <Link href="/terms" className="text-[#6b6b68] underline hover:text-[#0a0a0a]">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#6b6b68] underline hover:text-[#0a0a0a]">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-3 text-center text-xs text-[#a0a09c]">
          <Link href="/" className="hover:text-[#0a0a0a]">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
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
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 text-[#0a0a0a]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-1.92c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .97-.31 3.18 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.57.23 2.73.12 3.02.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.39-5.26 5.68.41.36.78 1.05.78 2.12v3.14c0 .31.21.66.8.55C20.22 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}
