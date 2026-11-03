import { toolCatalog } from "@/lib/tools/catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolHeader from "@/components/tools/tool-header";
import styles from "@/components/tools/tools.module.css";
export const metadata = { title: "ReDiagram · 工具箱", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function Tools() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <div className={styles.shell} lang="zh-CN">
    <ToolHeader active="tools" />
    <main className={`site-container ${styles.content}`}>
      <span className="eyebrow">ReDiagram 工具箱 · 本地预览</span>
      <h1 className="section-title">选择适合这次任务的工具</h1>
      <p className="section-copy">从参考图替换到图解修订，按任务选择，沿用你熟悉的工作方式。</p>
      <div className={styles.grid}>{toolCatalog.map(t=><Link key={t.href} href={t.href} className={styles.card}>
        <span className="eyebrow">{t.tag}</span><h2>{t.title}</h2><p>{t.description}</p>
        <span className={`button button-primary button-sm ${styles.action}`}>打开工具 <span aria-hidden="true">→</span></span>
      </Link>)}</div>
    </main>
  </div>;
}
