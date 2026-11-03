import Link from "next/link";
import BrandMark from "@/components/brand-mark";
import styles from "./tools.module.css";

export default function ToolHeader({ active }: { active: "tools" | "revision" }) {
  return (
    <header className="site-header" lang="en">
      <div className={`site-container site-header-inner ${styles.header}`}>
        <Link href="/" className="brand-lockup" aria-label="ReDiagram home">
          <BrandMark />
          <span className="brand-text">ReDiagram</span>
        </Link>
        <nav className={styles.nav} aria-label="Tool navigation">
          <Link href="/lab/tools" className="site-nav-link" aria-current={active === "tools" ? "page" : undefined}>Tools</Link>
          <Link href="/editor" className="site-nav-link">Fix</Link>
          <Link href="/lab/revisions" className="site-nav-link" aria-current={active === "revision" ? "page" : undefined}>Diagram Revision</Link>
          <Link href="/blog" className="site-nav-link">Guides</Link>
        </nav>
      </div>
    </header>
  );
}
