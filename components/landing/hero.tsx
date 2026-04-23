"use client"

import Link from "next/link"
import { useLang } from "@/contexts/lang-context"

export default function Hero() {
  const { lang, toggleLang } = useLang()

  return (
    <section className="hero-section">
      <div className="site-container hero-layout">
        <div className="hero-copy">
          <div className="hero-top-row">
            <h1 className="hero-title">
              <span className="lang-en">Fix any diagram without redrawing it.</span>
              <span className="lang-zh">无需重画，修好任何图表。</span>
            </h1>
            <button
              type="button"
              className="lang-toggle"
              onClick={toggleLang}
              aria-label={lang === "en" ? "Switch to Chinese" : "Switch to English"}
            >
              <span className="lang-en">中文</span>
              <span className="lang-zh">EN</span>
            </button>
          </div>

          <p className="hero-subtitle">
            <span className="lang-en">
              Repair architecture diagrams, UX wireframes, educational visuals, and illustrated
              layouts with a focused AI editor built for fast fixes instead of full rewrites.
            </span>
            <span className="lang-zh">
              用专注于"修正"而不是"重做"的 AI 编辑器，快速修复架构图、UX 线框图、教学材料和插图排版。
            </span>
          </p>

          <div className="hero-actions">
            <Link href="/editor" className="button button-primary">
              <span className="lang-en">Try Fix</span>
              <span className="lang-zh">立即体验 Fix</span>
            </Link>
            <a href="#how-it-works" className="button button-ghost">
              <span className="lang-en">See how it works</span>
              <span className="lang-zh">查看工作方式</span>
            </a>
          </div>
        </div>

        <div className="hero-media">
          <div className="hero-video-placeholder" role="img" aria-label="Hero video placeholder">
            <span>Hero video placeholder 1280×800</span>
          </div>
        </div>
      </div>
    </section>
  )
}
