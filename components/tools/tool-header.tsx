import Link from "next/link";
import BrandMark from "@/components/brand-mark";
import styles from "./tools.module.css";

export default function ToolHeader({ active }: { active: "tools" | "revision" }) {
  return (
    <header className="site-header">
      <div className={`site-container site-header-inner ${styles.header}`}>
        <Link href="/" className="brand-lockup" aria-label="ReDiagram 首页">
          <BrandMark />
          <span className="brand-text">ReDiagram</span>
        </Link>
        <nav className={styles.nav} aria-label="工具导航">
          <Link href="/lab/tools" className="site-nav-link" aria-current={active === "tools" ? "page" : undefined}>工具箱</Link>
          <Link href="/editor" className="site-nav-link">参考图替换</Link>
          <Link href="/lab/revisions" className="site-nav-link" aria-current={active === "revision" ? "page" : undefined}>图解修订</Link>
        </nav>
      </div>
    </header>
  );
}
