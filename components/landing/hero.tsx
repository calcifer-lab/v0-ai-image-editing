"use client"

import Link from "next/link"

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
          {/* Hero visual: 7-8s animated demo loop — placeholder until designed */}
          <div className="hero-demo-placeholder" aria-label="Animated demo: coffee shop scene with bicycle">
            <div className="hero-demo-inner">
              <span className="lang-en">7–8s animated demo</span>
              <span className="lang-zh">7–8秒动态演示</span>
              <p className="hero-demo-caption lang-en">
                Coffee shop illustration + bicycle → reference photo → style-transferred result
              </p>
              <p className="hero-demo-caption lang-zh">
                咖啡馆插画 + 自行车 → 参考图 → 风格转换后结果
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
