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

export default function Hero({ showTools = false }: { showTools?: boolean }) {
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
              {showTools ? "Replace a region with a reference image, or review diagram revisions and keep the changes you want." : "Take what you want from one image. Compose it into another. Leave the rest untouched."}
            </span>
            <span className="lang-zh">
              {showTools ? "用参考图片替换局部，或对比图解修订版本，采纳你想保留的修改。" : "从一张图里取出好的部分，合成到另一张图。其余分毫不动。"}
            </span>
          </p>

          <div className="hero-actions">
            {showTools && <Link href="/lab/tools" className="button button-primary" lang="en">Explore tools</Link>}
            <Link href="/editor" className={`button ${showTools ? "button-ghost" : "button-primary"}`}>
              <span className="lang-en">Try Fix</span>
              <span className="lang-zh">体验 Fix</span>
            </Link>
            {!showTools && <a href="#how-it-works" className="button button-ghost">
              <span className="lang-en">See how it works</span>
              <span className="lang-zh">看看怎么用</span>
            </a>}
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
