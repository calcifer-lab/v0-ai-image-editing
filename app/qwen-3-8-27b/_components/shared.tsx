import type { ReactNode } from "react"

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string
  eyebrow?: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="border-t border-border bg-background py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-6 max-w-3xl">
          {eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">{eyebrow}</p> : null}
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "official" | "estimated" }) {
  const toneClass =
    tone === "official"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "estimated"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-border bg-muted text-muted-foreground"

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}>{children}</span>
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  )
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-[#111827] px-4 py-3 text-sm text-white">
      <code>{children}</code>
    </pre>
  )
}
