"use client"

import Link from "next/link"
import { useLang } from "@/contexts/lang-context"

const NAV_LINKS = [
  {
    href: "#audience",
    en: "Who it's for",
    zh: "适合谁用",
  },
  {
    href: "#how-it-works",
    en: "How it works",
    zh: "工作方式",
  },
  {
    href: "#modules",
    en: "Modules",
    zh: "产品模块",
  },
  {
    href: "#faq",
    en: "FAQ",
    zh: "常见问题",
  },
]

export default function Header() {
  const { lang, toggleLang } = useLang()

  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link href="/" className="brand-lockup" aria-label="ReDiagram AI">
          <span className="brand-mark">R</span>
          <span className="brand-text">ReDiagram AI</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="site-nav-link">
              <span className="lang-en">{link.en}</span>
              <span className="lang-zh">{link.zh}</span>
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <button
            type="button"
            className="lang-toggle-header"
            onClick={toggleLang}
            aria-label={lang === "en" ? "Switch to Chinese" : "Switch to English"}
          >
            <span className="lang-en">中文</span>
            <span className="lang-zh">EN</span>
          </button>
          <Link href="/editor" className="button button-primary button-sm">
            <span className="lang-en">Try Fix</span>
            <span className="lang-zh">体验 Fix</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
