import Link from "next/link";
import { toolCatalog } from "@/lib/tools/catalog";
import styles from "./tools.module.css";

export default function ToolCards() {
  return (
    <div className={styles.grid}>
      {toolCatalog.map((tool) => (
        <Link key={tool.id} href={tool.href} className={styles.card}>
          <span className="eyebrow">{tool.tag}</span>
          <h3>{tool.title}</h3>
          <p>{tool.description}</p>
          <span className={`button button-primary button-sm ${styles.action}`}>
            Open {tool.title} <span aria-hidden="true">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
