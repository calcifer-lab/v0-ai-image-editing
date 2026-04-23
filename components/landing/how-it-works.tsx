"use client"

const STEPS = [
  {
    number: "01",
    titleEn: "Upload",
    titleZh: "上传",
    bodyEn: "Bring in the diagram you need to fix, whether it is technical, visual, or educational.",
    bodyZh: "导入你需要修复的图表，无论是技术图、视觉稿还是教学素材。",
    imgSrc: "/demo/step1-upload.svg",
    imgAlt: "Upload step: drag and drop or click to upload",
  },
  {
    number: "02",
    titleEn: "Select",
    titleZh: "选择",
    bodyEn: "Mark the region, node, connector, or label that needs attention and keep the rest intact.",
    bodyZh: "选中需要处理的区域、节点、连线或标签，其余内容保持不变。",
    imgSrc: "/demo/step2-select.svg",
    imgAlt: "Select step: mark the region to fix",
  },
  {
    number: "03",
    titleEn: "Fix",
    titleZh: "修复",
    bodyEn: "Let Fix repair layout, spacing, labels, and visual consistency without redrawing the diagram.",
    bodyZh: "使用 Fix 修复布局、间距、标签和视觉一致性，无需重画整张图表。",
    imgSrc: "/demo/step3-fix.svg",
    imgAlt: "Fix step: AI repairs the selected region",
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
            <span className="lang-en">Three steps from broken to clean.</span>
            <span className="lang-zh">三步完成，从问题图到成品图。</span>
          </h2>
          <p className="section-copy">
            <span className="lang-en">
              The workflow is intentionally narrow: upload the file, point at the problem, and let
              the Fix module repair it.
            </span>
            <span className="lang-zh">
              工作流刻意保持简洁：上传文件，指出问题，再由 Fix 模块完成修复。
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
              <img
                src={step.imgSrc}
                alt={step.imgAlt}
                className="step-img"
                loading="lazy"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
