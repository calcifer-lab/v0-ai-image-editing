"use client"

import Link from "next/link"

const AUDIENCE_CARDS = [
  {
    // Publication-Ready Creation
    icon: "✦",
    titleEn: "Publication-Ready Creation",
    titleZh: "出版与公开发布",
    subtitleEn: "Submitting, shipping, posting, sharing — all publication now.",
    subtitleZh: "投稿、上架、发表、分享——都是出版。",
    bodyEn:
      "The moment your work goes public — submission, publishing, release — it's in publication territory. AI's broken details get amplified under public scrutiny. Compose lets you swap out what won't pass review with a compliant element, so the whole image holds up to editors, readers, and platforms alike.",
    bodyZh:
      "只要你的作品要公开发布——投稿、上架、发表——它就进入了出版场景。AI 生成的细节崩坏会在公开后被放大。用 Compose 把不能过审的那一处换成合规元素，让整张图经得起编辑、读者、平台的三重审视。",
    beforeLabelEn: "Needs a fix before release",
    beforeLabelZh: "发布前需修正",
    ctaEn: "Try on your release draft",
    ctaZh: "试试你的发布稿",
  },
  {
    // Picture Books & Children's Illustration
    icon: "✦",
    titleEn: "Picture Books & Children's Illustration",
    titleZh: "绘本与儿童插图",
    subtitleEn: "Spread intact. Fix only the one thing.",
    subtitleZh: "跨页构图不变，只修那一处。",
    bodyEn:
      "AI-generated children's illustrations often slip in the details — exposed midriffs, wrong finger counts, props that break picture-book conventions. Compose lets you pull the right element from a compliant reference and drop it in, without touching the rest of the spread.",
    bodyZh:
      "AI 生成的儿童插画常常在细节上踩线——角色露肚脐、手指数量不对、道具造型违反儿童读物规范。用 Compose 从合规的参考元素里取出对的那一处，合成进去，整页画面的笔触和构图分毫不动。",
    beforeLabelEn: "Exposed midriff",
    beforeLabelZh: "角色露肚脐",
    ctaEn: "Try on your picture book",
    ctaZh: "试试你的绘本稿",
  },
  {
    // Comics & Motion Comics
    icon: "✦",
    titleEn: "Comics & Motion Comics",
    titleZh: "漫画与动态漫",
    subtitleEn: "Panel layout stays. Fix just the detail that broke.",
    subtitleZh: "分镜不重排，只换那一格里的那一处。",
    bodyEn:
      "Comic creators know the pain of inconsistent props across panels, or a single panel where AI got the weapon, the pose, or the expression wrong. Compose lets you pull the right version from another panel or reference and slot it in — the character and art style stay continuous.",
    bodyZh:
      "漫画创作最怕角色道具在分镜之间前后不一致，或者 AI 把某一格的道具、武器、表情画崩了。用 Compose 从另一格或参考图里取出对的部分，无缝合成到崩坏的那一格，角色和画风保持连贯。",
    beforeLabelEn: "Broken prop geometry",
    beforeLabelZh: "道具结构崩坏",
    ctaEn: "Try on your comic panel",
    ctaZh: "试试你的漫画分镜",
  },
  {
    // Educational Visuals
    icon: "✦",
    titleEn: "Educational Visuals",
    titleZh: "教学与课件配图",
    subtitleEn: "Keep the image. Make the knowledge right.",
    subtitleZh: "画面保留，只让知识对。",
    bodyEn:
      "Teaching visuals must be factually correct — but AI-generated anatomy, machinery, molecular models, and maps often fail classroom scrutiny. Compose lets you pull the correct element from an authoritative reference and blend it in, so the layout stays and what students learn is right.",
    bodyZh:
      "教学配图的底线是知识不能错——AI 画的人体解剖、机械结构、分子模型、地图比例往往经不起课堂审视。用 Compose 从权威参考里取出正确的那部分，合成进你的插图，版面不变，学生学到的就是对的。",
    beforeLabelEn: "Incorrect anatomy",
    beforeLabelZh: "解剖结构错误",
    ctaEn: "Try on your teaching visual",
    ctaZh: "试试你的课件配图",
  },
]

export default function Features() {
  return (
    <section id="audience" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">Who it's for</span>
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
