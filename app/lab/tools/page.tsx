import ToolCards from "@/components/tools/tool-cards";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolHeader from "@/components/tools/tool-header";
import styles from "@/components/tools/tools.module.css";
export const metadata = { title: "ReDiagram · Tools", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function Tools() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <div className={styles.shell} lang="en">
    <ToolHeader active="tools" />
    <main className={`site-container ${styles.content}`}>
      <span className="eyebrow">ReDiagram Tools · Local preview</span>
      <h1 className="section-title">Choose the right tool for your task</h1>
      <p className="section-copy">From reference patches to diagram revisions, choose a focused workflow for the job.</p>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Looking for Try Fix? Open Fix below — it is the same reference patch editor.</p>
      <h2 className="sr-only">Available tools</h2>
      <ToolCards />
      <section className="mt-12" aria-labelledby="tool-guides">
        <h2 id="tool-guides" className="text-2xl font-semibold">Practical guides</h2>
        <ul className="mt-4 space-y-3">
          <li><Link className="underline underline-offset-4" href="/blog/edit-flowchart-screenshot-without-source-file">Edit a flowchart screenshot without the source file</Link></li>
          <li><Link className="underline underline-offset-4" href="/blog/replace-flowchart-region-with-reference-image">Replace a diagram region with a reference image</Link></li>
          <li><Link className="underline underline-offset-4" href="/blog/review-ai-diagram-edits-before-accepting">Review and accept diagram edits · Local preview guide</Link></li>
        </ul>
      </section>
    </main>
  </div>;
}
