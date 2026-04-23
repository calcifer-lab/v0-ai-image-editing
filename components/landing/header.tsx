"use client"

import Link from "next/link"

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
          <Link href="/editor" className="button button-primary button-sm">
            <span className="lang-en">Try Fix</span>
            <span className="lang-zh">体验 Fix</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
