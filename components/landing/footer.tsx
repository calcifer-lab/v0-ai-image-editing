"use client"

import { Github, Rocket, Twitter } from "lucide-react"

const FOOTER_LINKS = [
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

const SOCIAL_LINKS = [
  { href: "https://github.com", label: "GitHub", icon: Github },
  { href: "https://x.com", label: "X", icon: Twitter },
  { href: "https://producthunt.com", label: "Product Hunt", icon: Rocket },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="site-container footer-layout">
        <div className="footer-brand">
          <a href="/" className="brand-lockup" aria-label="ReDiagram AI home">
            <span className="brand-mark">R</span>
            <span className="brand-text">ReDiagram AI</span>
          </a>
          <p className="footer-slogan">
            <span className="lang-en">Fix any diagram without redrawing it.</span>
            <span className="lang-zh">无需重画，修好任何图表。</span>
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="footer-link">
              <span className="lang-en">{link.en}</span>
              <span className="lang-zh">{link.zh}</span>
            </a>
          ))}
        </nav>

        <div className="footer-socials">
          {SOCIAL_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
                aria-label={item.label}
              >
                <Icon size={16} />
              </a>
            )
          })}
        </div>

        <p className="footer-copy">© {year} ReDiagram AI. All rights reserved.</p>
      </div>
    </footer>
  )
}
