"use client"

import Link from "next/link"

const AUDIENCE_CARDS = [
  {
    emoji: "🛠️",
    titleEn: "Engineers",
    titleZh: "工程师",
    bodyEn:
      "Patch architecture diagrams, sequence flows, and systems maps after requirements shift.",
    bodyZh: "在需求变化后，快速修补架构图、时序图和系统流程图。",
    primaryEn: "Fix a system diagram",
    primaryZh: "修复系统图",
    secondaryEn: "See Fix module",
    secondaryZh: "查看 Fix 模块",
  },
  {
    emoji: "✏️",
    titleEn: "Designers",
    titleZh: "设计师",
    bodyEn:
      "Adjust wireframes, user flows, and concept diagrams without recreating the whole board.",
    bodyZh: "无需重做整个画板，即可调整线框图、用户流程图和概念图。",
    primaryEn: "Repair wireframes",
    primaryZh: "修复线框图",
    secondaryEn: "Join early access",
    secondaryZh: "加入抢先体验",
  },
  {
    emoji: "📚",
    titleEn: "Authors",
    titleZh: "作者",
    bodyEn:
      "Update illustrated layouts, callouts, and page diagrams while keeping the original composition intact.",
    bodyZh: "在保持原始构图的前提下，更新插图排版、标注和页面示意图。",
    primaryEn: "Edit visual drafts",
    primaryZh: "编辑视觉草稿",
    secondaryEn: "Explore modules",
    secondaryZh: "浏览模块",
  },
  {
    emoji: "🎓",
    titleEn: "Educators",
    titleZh: "教育工作者",
    bodyEn:
      "Refresh training materials, class diagrams, and teaching visuals for each cohort or lesson.",
    bodyZh: "为不同学员和课程快速更新培训资料、课堂图示和教学视觉内容。",
    primaryEn: "Try on materials",
    primaryZh: "用于教学材料",
    secondaryEn: "Read FAQ",
    secondaryZh: "阅读 FAQ",
  },
]

export default function Features() {
  return (
    <section id="audience" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">Who is this for</span>
            <span className="lang-zh">适合谁用</span>
          </span>
          <h2 className="section-title">
            <span className="lang-en">Built for teams that edit diagrams under pressure.</span>
            <span className="lang-zh">为高频修改图表的团队而设计。</span>
          </h2>
          <p className="section-copy">
            <span className="lang-en">
              ReDiagram AI is designed for practical diagram work: revise what changed, preserve
              the rest, and move on.
            </span>
            <span className="lang-zh">
              ReDiagram AI 面向真实的图表修改场景而设计：只改变化的部分，保留其余内容，继续推进工作。
            </span>
          </p>
        </div>

        <div className="cards-grid audience-grid">
          {AUDIENCE_CARDS.map((card) => (
            <article key={card.titleEn} className="landing-card audience-card">
              <div className="audience-icon" aria-hidden="true">
                {card.emoji}
              </div>
              <h3 className="audience-title">
                <span className="lang-en">{card.titleEn}</span>
                <span className="lang-zh">{card.titleZh}</span>
              </h3>
              <p className="audience-copy">
                <span className="lang-en">{card.bodyEn}</span>
                <span className="lang-zh">{card.bodyZh}</span>
              </p>
              <div className="audience-actions">
                <Link href="/editor" className="button button-primary button-sm">
                  <span className="lang-en">{card.primaryEn}</span>
                  <span className="lang-zh">{card.primaryZh}</span>
                </Link>
                <a href="#modules" className="button button-ghost button-sm">
                  <span className="lang-en">{card.secondaryEn}</span>
                  <span className="lang-zh">{card.secondaryZh}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
