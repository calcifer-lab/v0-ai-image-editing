"use client"

const STEPS = [
  {
    number: "01",
    titleEn: "Upload your image and the patch",
    titleZh: "上传原图和补丁",
    bodyEn: "Bring the image that needs a fix — and the patch that will fix it. The patch can be another AI image, a real photo, or anything you've got.",
    bodyZh: "带来需要修复的原图，以及用来修复的补丁。补丁可以是另一张 AI 图、一张真实照片，或你手边任何一张素材。",
  },
  {
    number: "02",
    titleEn: "Mark the patch, mark the spot",
    titleZh: "圈出补丁和要打补丁的地方",
    bodyEn: "Point at the exact region in the main image that needs replacing. Then point at the element in your patch you want to use.",
    bodyZh: "在主图上标出需要替换的区域，再在补丁上标出你想取用的元素。",
  },
  {
    number: "03",
    titleEn: "Fix it",
    titleZh: "修好",
    bodyEn: "Leave the rest to us — style, lighting, edges all align automatically.",
    bodyZh: "剩下的交给我们，风格、光影、边缘自动对齐。",
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
              {/* Step illustration placeholder — replace with designed visuals */}
              <div className="step-placeholder">
                <span className="lang-en">Step {step.number} illustration</span>
                <span className="lang-zh">第 {step.number} 步示意</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
