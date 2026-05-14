"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Mail } from "lucide-react"
import BrandMark from "@/components/brand-mark"

const EMAIL = "hello@rediagram.com"
const X_HANDLE = "@RediagramFIX"
const X_URL = "https://x.com/RediagramFIX"

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const NAV_LINKS = [
  { href: "#audience", en: "Who it's for", zh: "适合谁用" },
  { href: "#how-it-works", en: "How it works", zh: "工作方式" },
  { href: "#faq", en: "FAQ", zh: "常见问题" },
  { href: "/about", en: "About", zh: "关于" },
]

const LEGAL_LINKS = [
  { href: "/privacy", en: "Privacy Policy", zh: "隐私政策" },
  { href: "/terms", en: "Terms of Service", zh: "服务条款" },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="site-container footer-layout">
        {/* Brand column */}
        <div className="footer-brand">
          <a href="/" className="brand-lockup" aria-label="ReDiagram home">
            <BrandMark />
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

        {/* Navigate column */}
        <nav className="footer-col footer-nav" aria-label="Footer navigation">
          <h3 className="footer-col-head">
            <span className="lang-en">Navigate</span>
            <span className="lang-zh">导航</span>
          </h3>
          <ul className="footer-col-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="footer-link">
                  <span className="lang-en">{link.en}</span>
                  <span className="lang-zh">{link.zh}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Connect column */}
        <div className="footer-col footer-connect">
          <h3 className="footer-col-head">
            <span className="lang-en">Connect</span>
            <span className="lang-zh">联系</span>
          </h3>
          <div className="flex flex-col gap-2.5">
            <ConnectRow
              icon={<Mail size={16} />}
              value={EMAIL}
              copyValue={EMAIL}
              externalHref={`mailto:${EMAIL}`}
              ariaLabel="Email"
            />
            <ConnectRow
              icon={<XIcon size={16} />}
              value={X_HANDLE}
              copyValue={X_HANDLE}
              externalHref={X_URL}
              ariaLabel="X (Twitter)"
            />
          </div>
        </div>

        {/* Legal column */}
        <div className="footer-col footer-legal">
          <h3 className="footer-col-head">
            <span className="lang-en">Legal</span>
            <span className="lang-zh">法务</span>
          </h3>
          <ul className="footer-col-list">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="footer-link footer-legal-link">
                  <span className="lang-en">{link.en}</span>
                  <span className="lang-zh">{link.zh}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Copyright (separate full-width row) */}
        <p className="footer-copy">© {year} ReDiagram. All rights reserved.</p>
      </div>
    </footer>
  )
}

function ConnectRow({
  icon,
  value,
  copyValue,
  externalHref,
  ariaLabel,
}: {
  icon: React.ReactNode
  value: string
  copyValue: string
  externalHref: string
  ariaLabel: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API can fail on insecure contexts / older browsers — fall
      // back to a text selection so the user can still copy manually.
      const range = document.createRange()
      const selection = window.getSelection()
      const el = document.createElement("span")
      el.textContent = copyValue
      document.body.appendChild(el)
      range.selectNodeContents(el)
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div
      className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
      aria-label={ariaLabel}
    >
      <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="select-text font-mono text-[13px] text-[var(--text)]">
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : `Copy ${value}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text)]"
      >
        {copied ? (
          <Check size={14} aria-hidden="true" className="text-[var(--success)]" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
      </button>
      <a
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${ariaLabel}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text)]"
      >
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  )
}
