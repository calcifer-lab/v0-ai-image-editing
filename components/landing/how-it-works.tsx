"use client"

const STEPS = [
  {
    number: "01",
    titleEn: "Upload your image and the patch",
    titleZh: "上传原图和补丁",
    bodyEn: "Bring the image that needs a fix — and the patch that will fix it. The patch can be another AI image, a real photo, or anything you've got.",
    bodyZh: "带来需要修复的原图，以及用来修复的补丁。补丁可以是另一张 AI 图、一张真实照片，或你手边任何一张素材。",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        <line x1="160" y1="90" x2="160" y2="125" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="153,118 160,128 167,118" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="330" y1="90" x2="330" y2="115" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="323,108 330,118 337,108" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="60" y="140" width="200" height="130" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="75" y1="220" x2="245" y2="220" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="170,220 195,180 220,220" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="85" y="240" width="22" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <rect x="290" y="130" width="80" height="140" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="300" y1="220" x2="360" y2="220" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="330" cy="180" r="14" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    number: "02",
    titleEn: "Mark the patch, mark the spot",
    titleZh: "圈出补丁和要打补丁的地方",
    bodyEn: "Point at the exact region in the main image that needs replacing. Then point at the element in your patch you want to use.",
    bodyZh: "在主图上标出需要替换的区域，再在补丁上标出你想取用的元素。",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        <rect x="60" y="140" width="200" height="130" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="75" y1="220" x2="245" y2="220" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="170,220 195,180 220,220" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="85" y="240" width="22" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <rect x="290" y="130" width="80" height="140" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="300" y1="220" x2="360" y2="220" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="330" cy="180" r="14" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <ellipse cx="330" cy="180" rx="22" ry="22" fill="none" stroke="#E94E1B" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="195" cy="200" rx="32" ry="28" fill="none" stroke="#E94E1B" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M 308 175 Q 250 110 220 188" fill="none" stroke="#E94E1B" strokeWidth="2" strokeDasharray="5,5" strokeLinecap="round"/>
        <polyline points="227,182 219,190 226,196" fill="none" stroke="#E94E1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    number: "03",
    titleEn: "Fix it",
    titleZh: "修好",
    bodyEn: "Leave the rest to us — style, lighting, edges all align automatically.",
    bodyZh: "剩下的交给我们，风格、光影、边缘自动对齐。",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        <rect x="60" y="140" width="200" height="130" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="75" y1="220" x2="245" y2="220" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <rect x="85" y="240" width="22" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <circle cx="195" cy="207" r="13" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <polyline points="305,205 318,218 340,193" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">How it works</span>
            <span className="lang-zh">工作方式</span>
          </span>
          <h2 className="section-title">
            <span className="lang-en">Find a patch. Fix it in three steps.</span>
            <span className="lang-zh">补丁在手，三步修好。</span>
          </h2>
          <p className="section-copy">
            <span className="lang-en">
              Your patch can be another AI image, a real photo, or anything you've got.
            </span>
            <span className="lang-zh">
              补丁可以是另一张 AI 图、一张真实照片，或你手边任何一张素材。
            </span>
          </p>
        </div>

        <div className="how-grid">
          {STEPS.map((step) => (
            <article key={step.number} className="landing-card how-card">
              <div className="how-step-number">{step.number}</div>
              <h3 className="how-step-title">
                <span className="lang-en">{step.titleEn}</span>
                <span className="lang-zh">{step.titleZh}</span>
              </h3>
              <p className="how-step-copy">
                <span className="lang-en">{step.bodyEn}</span>
                <span className="lang-zh">{step.bodyZh}</span>
              </p>
              <div className="step-svg-wrapper">
                {step.svg}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
