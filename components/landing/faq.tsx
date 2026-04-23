"use client"

import Link from "next/link"
import { useState } from "react"

const FAQS = [
  {
    qEn: "What does Fix handle today?",
    qZh: "Fix 现在能处理什么？",
    aEn:
      "Fix focuses on targeted diagram repair: misaligned elements, broken spacing, label cleanup, and small structural corrections inside an existing diagram.",
    aZh: "Fix 目前专注于定点修复：错位元素、间距问题、标签整理，以及现有图表中的小范围结构修正。",
  },
  {
    qEn: "Do I need to redraw the whole diagram first?",
    qZh: "我需要先重画整张图吗？",
    aEn:
      "No. The goal is the opposite: keep the diagram you already have, select the problem area, and repair only what changed.",
    aZh: "不需要。目标正好相反：保留你已有的图表，选中问题区域，只修变化的部分。",
  },
  {
    qEn: "Who is ReDiagram AI built for?",
    qZh: "ReDiagram AI 面向哪些人？",
    aEn:
      "The product is designed for engineers, designers, authors, and educators who regularly revise diagrams under deadline pressure.",
    aZh: "产品面向工程师、设计师、作者和教育工作者，尤其适合经常在截止时间前修改图表的人。",
  },
  {
    qEn: "Are the other modules available now?",
    qZh: "其他模块现在能用吗？",
    aEn:
      "Only Fix is available now. Core is coming soon, while Style and Character are on the roadmap and open for early access interest.",
    aZh: "目前只有 Fix 可用。Core 即将推出，Style 和 Character 仍在路线图中，可先登记抢先体验。",
  },
  {
    qEn: "Can I use ReDiagram AI for wireframes and teaching materials?",
    qZh: "我可以把 ReDiagram AI 用在线框图和教学材料上吗？",
    aEn:
      "Yes. The landing page examples focus on technical and visual diagram work, but the workflow also fits classroom visuals, onboarding docs, and illustrated learning assets.",
    aZh: "可以。虽然页面重点展示技术和视觉图表，但这套工作流同样适合课堂图示、培训文档和插图类学习材料。",
  },
  {
    qEn: "How do I hear about new modules?",
    qZh: "如何获取新模块的消息？",
    aEn:
      "Use the notify actions in the Modules section. We collect your email and workflow so we can invite the right early users first.",
    aZh: "可在模块区域点击通知按钮。我们会收集你的邮箱和使用场景，优先邀请匹配的早期用户。",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-title">
            <span className="lang-en">Common questions, directly answered.</span>
            <span className="lang-zh">常见问题，直接回答。</span>
          </h2>
        </div>

        <div className="faq-list">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <article key={item.qEn} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="faq-trigger"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question">
                    <span className="lang-en">{item.qEn}</span>
                    <span className="lang-zh">{item.qZh}</span>
                  </span>
                  <span className="faq-symbol" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <div className="faq-answer">
                    <span className="lang-en">{item.aEn}</span>
                    <span className="lang-zh">{item.aZh}</span>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>

        <div className="landing-card faq-cta">
          <div>
            <p className="faq-cta-kicker">
              <span className="lang-en">Ready to try the first module?</span>
              <span className="lang-zh">准备体验第一个模块了吗？</span>
            </p>
            <h3 className="faq-cta-title">
              <span className="lang-en">Start with Fix and repair the diagram you already have.</span>
              <span className="lang-zh">从 Fix 开始，修好你已经拥有的那张图。</span>
            </h3>
          </div>
          <div className="faq-cta-actions">
            <Link href="/editor" className="button button-primary">
              <span className="lang-en">Open editor</span>
              <span className="lang-zh">打开编辑器</span>
            </Link>
            <a href="#modules" className="button button-ghost">
              <span className="lang-en">View modules</span>
              <span className="lang-zh">查看模块</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
