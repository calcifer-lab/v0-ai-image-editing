import { toolCatalog } from "@/lib/tools/catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
export const metadata = {
  title: "ReDiagram · 工具箱",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Tools() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main
      style={{ maxWidth: 960, margin: "60px auto", padding: 24 }}
      lang="zh-CN"
    >
      <p>ReDiagram · 本地工具箱</p>
      <h1 style={{ fontSize: 36, margin: "16px 0" }}>选择适合这次任务的工具</h1>
      <p>不同任务，各自独立的工作流程。原有工具继续保留。</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 24,
          marginTop: 32,
        }}
      >
        {toolCatalog.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            style={{
              border: "1px solid #ccd8ce",
              borderRadius: 16,
              padding: 28,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <small>{t.tag}</small>
            <h2 style={{ fontSize: 24, margin: "12px 0" }}>{t.title}</h2>
            <p>{t.description}</p>
            <p style={{ marginTop: 24 }}>打开工具 →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
