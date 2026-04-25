"use client"

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

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
    href: "#faq",
    en: "FAQ",
    zh: "常见问题",
  },
  {
    href: "#about",
    en: "About",
    zh: "关于",
  },
]

const SOCIAL_LINKS = [
  { href: "mailto:hello@rediagram.com", label: "Email", icon: null },
  { href: "https://x.com/RediagramAI", label: "X", icon: XIcon },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="site-container footer-layout">
        {/* Brand column */}
        <div className="footer-brand">
          <a href="/" className="brand-lockup" aria-label="ReDiagram home">
            <span className="brand-mark">R</span>
            <span className="brand-text">ReDiagram</span>
          </a>
          <p className="footer-slogan">
            <span className="lang-en">Keep what works. Change only what needs to.</span>
            <span className="lang-zh">保留对的，只改要改的。</span>
          </p>
          <p className="footer-announcement">
            <span className="lang-en">
              ReDiagram is expanding. Vector tools for professional designers — coming soon.
            </span>
            <span className="lang-zh">
              ReDiagram 还在扩展。面向专业设计师的矢量工具，即将上线。
            </span>
          </p>
        </div>

        {/* Navigation column */}
        <nav className="footer-nav" aria-label="Footer navigation">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="footer-link">
              <span className="lang-en">{link.en}</span>
              <span className="lang-zh">{link.zh}</span>
            </a>
          ))}
        </nav>

        {/* Connect column */}
        <div className="footer-connect">
          <div className="footer-socials">
            {SOCIAL_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="footer-social-link"
                  aria-label={item.label}
                >
                  {Icon ? <Icon size={16} /> : <span className="footer-email-icon">@</span>}
                </a>
              )
            })}
          </div>
        </div>

        {/* Legal row */}
        <div className="footer-legal">
          <a href="/privacy" className="footer-legal-link">
            <span className="lang-en">Privacy Policy</span>
            <span className="lang-zh">隐私政策</span>
          </a>
          <a href="/terms" className="footer-legal-link">
            <span className="lang-en">Terms of Service</span>
            <span className="lang-zh">服务条款</span>
          </a>
        </div>

        {/* Copyright */}
        <p className="footer-copy">© {year} ReDiagram. All rights reserved.</p>
      </div>
    </footer>
  )
}
