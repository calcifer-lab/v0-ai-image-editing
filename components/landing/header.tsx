import Link from "next/link"
import AuthControls from "@/components/auth/auth-controls"
import LangSwitcher from "@/components/lang-switcher"

const NAV_LINKS = [
  { href: "#audience", en: "Who it's for", zh: "适合谁用" },
  { href: "#how-it-works", en: "How it works", zh: "工作方式" },
  { href: "/blog", en: "Blog", zh: "博客" },
  { href: "#faq", en: "FAQ", zh: "常见问题" },
]

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link href="/" className="brand-lockup" aria-label="ReDiagram">
          <svg
            width="32"
            height="32"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="100" height="100" rx="20" fill="#111111" />
            <line x1="33.5" y1="22" x2="33.5" y2="78" stroke="#FAF9F6" strokeWidth="9" strokeLinecap="round" />
            <path
              d="M 33.5,22 Q 70,22 70,36 Q 70,50 33.5,50"
              stroke="#FAF9F6"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="51.5" y1="50" x2="67" y2="78" stroke="#C4782B" strokeWidth="9" strokeLinecap="round" />
          </svg>
          <span className="brand-text">ReDiagram</span>
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
          <LangSwitcher />
          <AuthControls variant="site" />
          <Link href="/editor" className="button button-primary button-sm">
            <span className="lang-en">Try Fix</span>
            <span className="lang-zh">体验 Fix</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
