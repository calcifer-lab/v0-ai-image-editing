"use client"

import Link from "next/link"
import dynamic from "next/dynamic"

const HeroVideo = dynamic(() => import("@/components/HeroVideo").then((m) => m.HeroVideo), {
  ssr: false,
  loading: () => (
    <div className="hero-demo-placeholder" aria-label="Loading demo...">
      <div className="hero-demo-inner">
        <span className="lang-en">Loading demo...</span>
      </div>
    </div>
  ),
})

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="site-container hero-layout">
        <div className="hero-copy">
          <h1 className="hero-title">
            <span className="lang-en">
              Keep the 90% AI got right.<br />Compose the 10% it didn't.
            </span>
            <span className="lang-zh">
              把 AI 画对的部分留下，<br />画崩的部分换掉。
            </span>
          </h1>

          <p className="hero-subtitle">
            <span className="lang-en">
              Take what you want from one image. Compose it into another. Leave the rest untouched.
            </span>
            <span className="lang-zh">
              从一张图里取出好的部分，合成到另一张图。其余分毫不动。
            </span>
          </p>

          <div className="hero-actions">
            <Link href="/editor" className="button button-primary">
              <span className="lang-en">Try Fix</span>
              <span className="lang-zh">体验 Fix</span>
            </Link>
            <a href="#how-it-works" className="button button-ghost">
              <span className="lang-en">See how it works</span>
              <span className="lang-zh">看看怎么用</span>
            </a>
          </div>
        </div>

        <div className="hero-media">
          <div className="mt-12 max-w-4xl mx-auto">
            <HeroVideo />
          </div>
        </div>
      </div>
    </section>
  )
}
