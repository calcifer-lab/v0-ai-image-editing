const BMC_URL = "https://buymeacoffee.com/calciferta"

// Inline donation card. Used under the result image — small, calm, doesn't
// compete with the primary actions in the page header (Edit / Start New /
// Download).
export default function DonateInline() {
  return (
    <div className="mx-auto mt-2 flex w-full max-w-2xl flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-5 text-center sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
      <p className="text-sm leading-relaxed text-[var(--text)]">
        <span className="lang-en">
          This took real compute. If it worked —{" "}
          <span aria-hidden="true">☕</span>
        </span>
        <span className="lang-zh">
          这张图跑了真实的算力。如果你满意——
        </span>
      </p>
      <a
        href={BMC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="button button-ghost button-sm whitespace-nowrap"
      >
        <span aria-hidden="true">☕</span>
        <span>&nbsp;Buy Me a Coffee</span>
      </a>
    </div>
  )
}
