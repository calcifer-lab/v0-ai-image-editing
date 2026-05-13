const BMC_URL = "https://buymeacoffee.com/calciferta"

export default function DonateBanner() {
  return (
    <section
      aria-label="Support ReDiagram"
      className="px-4 py-10 sm:py-14"
    >
      <div className="site-container">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-8 text-center sm:px-10 sm:py-10">
          <h2 className="text-balance text-xl font-medium leading-snug tracking-tight text-[var(--text)] sm:text-2xl">
            <span className="lang-en">
              If Fix saved your image — buy us a coffee.
            </span>
            <span className="lang-zh">
              如果 Fix 帮你救了一张图，请我们喝杯咖啡。
            </span>
          </h2>
          <p className="text-balance text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            <span className="lang-en">Every cup keeps the compute running.</span>
            <span className="lang-zh">每一杯都让算力继续跑。</span>
          </p>
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-ghost button-sm mt-1"
          >
            <span aria-hidden="true">☕</span>
            <span>&nbsp;Buy Me a Coffee</span>
          </a>
        </div>
      </div>
    </section>
  )
}
