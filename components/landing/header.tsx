"use client"

import Link from "next/link"
import { useLang } from "@/contexts/lang-context"

export default function Header() {
  const { lang, toggleLang } = useLang()

  return (
    <nav className="ba-nav">
      <div className="ba-nav-inner">
        <Link href="/" className="ba-brand">
          <div className="ba-brand-mark">B</div>
          <div className="ba-brand-name">
            BlendAI <sub>beta</sub>
          </div>
        </Link>

        <div className="ba-nav-links">
          <a className="ba-nav-link" href="#showcase">
            <span className="lang-en">Examples</span>
            <span className="lang-zh">案例展示</span>
          </a>
          <a className="ba-nav-link" href="#how">
            <span className="lang-en">How It Works</span>
            <span className="lang-zh">使用流程</span>
          </a>
          <a className="ba-nav-link" href="#features">
            <span className="lang-en">Features</span>
            <span className="lang-zh">功能特点</span>
          </a>
          <a className="ba-nav-link" href="#faq">FAQ</a>
        </div>

        <div className="ba-nav-actions">
          <button className="ba-lang-btn" onClick={toggleLang}>
            <span className="lang-en">中文</span>
            <span className="lang-zh">EN</span>
          </button>
          <Link href="/editor?demo=true" className="ba-btn-cta">
            <span className="lang-en">Try Free</span>
            <span className="lang-zh">免费体验</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
