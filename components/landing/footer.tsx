"use client"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="ba-footer">
      <div className="ba-footer-inner">
        <a href="/" className="ba-brand">
          <div className="ba-brand-mark">B</div>
          <div className="ba-brand-name">
            BlendAI <sub>beta</sub>
          </div>
        </a>

        <div className="ba-footer-links">
          <a href="#showcase">
            <span className="lang-en">Examples</span>
            <span className="lang-zh">案例展示</span>
          </a>
          <a href="#how">
            <span className="lang-en">How It Works</span>
            <span className="lang-zh">使用流程</span>
          </a>
          <a href="#features">
            <span className="lang-en">Features</span>
            <span className="lang-zh">功能特点</span>
          </a>
          <a href="#faq">FAQ</a>
          <a href="/editor?demo=true">
            <span className="lang-en">Try Free</span>
            <span className="lang-zh">免费体验</span>
          </a>
        </div>

        <p>© {year} BlendAI. All rights reserved.</p>
      </div>
    </footer>
  )
}
