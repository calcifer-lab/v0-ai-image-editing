"use client"

import Link from "next/link"
import BeforeAfter from "@/components/BeforeAfter"

const AUDIENCE_CARDS = [
  {
    icon: "✦",
    titleEn: "Structural fidelity",
    titleZh: "复杂机械结构",
    subtitleEn: "Prop consistency for vehicle renders.",
    subtitleZh: "道具一致性",
    bodyEn:
      "Vehicles, machinery, and mechanical parts are unforgiving — one wrong wheel size or proportions breaks the whole render. Compose patches just the broken geometry, leaving the rest untouched.",
    bodyZh:
      "车辆、机械、零部件要求严苛——轮子尺寸或比例出错，整张图就废了。Compose 只修崩坏的那处结构，其余分毫不动。",
    beforeLabelEn: "Before — structural inconsistency",
    beforeLabelZh: "修复前：结构不一致",
    ctaEn: "Try on your render",
    ctaZh: "试试你的渲染图",
    beforeImage: "/homepage_demo_cards/card_1_grill/before.png",
    afterImage: "/homepage_demo_cards/card_1_grill/after.png",
  },
  {
    icon: "✦",
    titleEn: "Prop consistency",
    titleZh: "道具一致性",
    subtitleEn: "Every wheel should be the same.",
    subtitleZh: "每个轮子都一样。",
    bodyEn:
      "When AI generates multiple instances of the same object — wheels on a car, books on a shelf, windows in a building — it often adds inconsistency. Compose fixes just the mismatched items without regenerating the whole image.",
    bodyZh:
      "AI 生成同类物件的多个实例时——车轮、书架上的书、建筑窗户——常常出现不一致。Compose 只修不匹配的那几处，不用重生成整张图。",
    beforeLabelEn: "Before — mismatched wheels",
    beforeLabelZh: "修复前：轮子不一致",
    ctaEn: "Try on your scene",
    ctaZh: "试试你的场景图",
    beforeImage: "/homepage_demo_cards/card_2_wheels/before.png",
    afterImage: "/homepage_demo_cards/card_2_wheels/after.png",
  },
  {
    icon: "✦",
    titleEn: "Character detail",
    titleZh: "角色身份细节",
    subtitleEn: "Fix the identity, keep the style.",
    subtitleZh: "换身份，保留画风。",
    bodyEn:
      "AI-generated characters often lose consistency across scenes — the same phoenix looks different in every shot. Compose lets you pull a reference and patch in the right character detail while preserving the overall art style.",
    bodyZh:
      "AI 生成的角色在各个场景间常常失去一致性——同一只凤凰，每一帧看起来都不同。Compose 让你从参考图取元素，合成正确的角色细节，同时保留整体画风。",
    beforeLabelEn: "Before — character inconsistency",
    beforeLabelZh: "修复前：角色不一致",
    ctaEn: "Try on your character",
    ctaZh: "试试你的角色图",
    beforeImage: "/homepage_demo_cards/card_3_phoenix/before.png",
    afterImage: "/homepage_demo_cards/card_3_phoenix/after.png",
  },
  {
    icon: "✦",
    titleEn: "Architectural fidelity",
    titleZh: "复杂空间结构",
    subtitleEn: "Structure the space, not the whole image.",
    subtitleZh: "重构空间，不动全图。",
    bodyEn:
      "Architectural renders and spatial scenes have complex depth and lighting that AI struggles to maintain consistently. Compose patches only the broken structural element, preserving all the lighting, perspective, and surrounding context.",
    bodyZh:
      "建筑渲染和空间场景有复杂的深度和光照，AI 很难保持一致。Compose 只修崩坏的结构元素，保留所有光照、透视和周围环境。",
    beforeLabelEn: "Before — structural collapse",
    beforeLabelZh: "修复前：结构崩坏",
    ctaEn: "Try on your architectural render",
    ctaZh: "试试你的建筑渲染图",
    beforeImage: "/homepage_demo_cards/card_4_pavilion/before.png",
    afterImage: "/homepage_demo_cards/card_4_pavilion/after.png",
  },
]

export default function Features() {
  return (
    <section id="audience" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">Who it&apos;s for</span>
            <span className="lang-zh">适合谁用</span>
          </span>
          <h2 className="section-title">
            <span className="lang-en">Different work. One way through.</span>
            <span className="lang-zh">不同工作，同一种解法。</span>
          </h2>
        </div>

        <div className="cards-grid audience-grid">
          {AUDIENCE_CARDS.map((card) => (
            <article key={card.titleEn} className="landing-card audience-card">
              <BeforeAfter before={card.beforeImage} after={card.afterImage} />
              <div className="audience-icon" aria-hidden="true">
                {card.icon}
              </div>
              <h3 className="audience-title">
                <span className="lang-en">{card.titleEn}</span>
                <span className="lang-zh">{card.titleZh}</span>
              </h3>
              <p className="audience-subtitle">
                <span className="lang-en">{card.subtitleEn}</span>
                <span className="lang-zh">{card.subtitleZh}</span>
              </p>
              <p className="audience-copy">
                <span className="lang-en">{card.bodyEn}</span>
                <span className="lang-zh">{card.bodyZh}</span>
              </p>
              <div className="audience-before-tag">
                <span className="lang-en">{card.beforeLabelEn}</span>
                <span className="lang-zh">{card.beforeLabelZh}</span>
              </div>
              <div className="audience-actions">
                <Link href="/editor" className="button button-primary button-sm">
                  <span className="lang-en">{card.ctaEn}</span>
                  <span className="lang-zh">{card.ctaZh}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
