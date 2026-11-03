"use client";

import Link from "next/link";
import BrandMark from "@/components/brand-mark";
import ToolSwitcher from "./tool-switcher";
import { useToolNavigation } from "./use-tool-navigation";
import styles from "./tools.module.css";

export default function ToolHeader({ active, leaveWarning }: { active: "tools" | "revision"; leaveWarning?: string }) {
  const { onNavigate, leaveDialog } = useToolNavigation(leaveWarning);
  return (
    <>
    <header className="site-header" lang="en">
      <div className={`site-container site-header-inner ${styles.header}`}>
        <Link href="/" className="brand-lockup" aria-label="ReDiagram home" onClick={onNavigate}>
          <BrandMark />
          <span className="brand-text">ReDiagram</span>
        </Link>
        <nav className={styles.nav} aria-label="Tool navigation">
          <ToolSwitcher current={active === "revision" ? "diagram-revision" : undefined} onNavigate={onNavigate} />
          <Link href="/blog" className="site-nav-link" onClick={onNavigate}>Guides</Link>
        </nav>
      </div>
    </header>
    {leaveDialog}
    </>
  );
}
