import Link from "next/link";
import ToolCards from "@/components/tools/tool-cards";

export default function ToolOverview() {
  return (
    <section id="tools" className="site-container py-16" lang="en" aria-labelledby="home-tools-title">
      <span className="eyebrow">ReDiagram Tools · Local preview</span>
      <h2 id="home-tools-title" className="section-title">One task. The right tool.</h2>
      <p className="section-copy">
        Have a replacement image ready? Start with Fix. Comparing revisions?
        Use Diagram Revision to review candidates and keep selected changes.
      </p>
      <ToolCards />
      <p className="mt-6 text-sm text-[var(--text-muted)]">
        Try Fix opens the original editor directly.{' '}
        <Link href="/lab/tools" className="underline underline-offset-4">Explore all tools and guides →</Link>
      </p>
    </section>
  );
}
