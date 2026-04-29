"use client"

import Link from "next/link"
import { useState } from "react"

const FAQS = [
  {
    qEn: "Will the result actually look seamless? Or will people see the seams?",
    qZh: "合成后的效果真的能做到无缝吗？会不会看出是拼的？",
    aEn:
      "This is what we fight with every day. The bar isn't 'passable' — it's 'you'd submit it, ship it, or print it.' If you zoom in and spot a seam, we failed. Send us the image — it goes into the next round of training.",
    aZh:
      `这是我们每天都在较劲的事。判断标准不是"看得过去"，是"你敢拿去投稿、上架、印刷"。如果你拉近看发现了拼接感，就是我们失败了——请把那张图发给我们，它会进入下一轮训练。`,
  },
  {
    qEn: "What if the patch and the main image look nothing alike — like a photo vs. an illustration?",
    qZh: "如果参考图和主图风格差很远（比如真实照片 vs 插画），也能处理好吗？",
    aEn:
      "This is exactly why Fix exists. AI can reroll within the same style all day — but when the only patch you've got is a real photo, that's our moment. The wider the style gap, the more Fix matters.",
    aZh:
      "这正是 Fix 存在的理由。AI 生成图能做到同风格抽卡几十次，但当你手里只有一张真实照片可以当补丁时，就是我们出场的时候。风格跨度越大，普通拼接越失败，Fix 越必要。",
  },
  {
    qEn: "How is this different from inpainting?",
    qZh: "和局部重绘（inpainting）有什么区别？",
    aEn:
      "Inpainting erases a region and asks AI to regenerate content to fill it — you're relying on the model to imagine what should be there. Element Transplant takes a different element you already have and transplants it in exactly as it is. When you already own the right reference, you shouldn't have to ask AI to guess — you point, we place.",
    aZh:
      "局部重绘是擦除一块区域，让 AI 重新生成内容来填充——你在让模型猜测那里应该是什么。器官移植则是把你已有的正确元素直接移植进去，一模一样。当你已经有心仪的参考素材时，为什么要让它重新生成？指认比猜测更可靠。",
  },
  {
    qEn: "How is this different from Photoshop's Generative Fill or other AI editors?",
    qZh: "这和 Photoshop 的 Generative Fill 或其他 AI 修图工具有什么不同？",
    aEn:
      "Generative Fill generates a fill from a text prompt — you describe what you want. Fix pulls what you want from a specific image you choose — you're not describing, you're pointing. When you care about quality and already have the right reference, pointing beats prompting.",
    aZh:
      `Generative Fill 是"从文字描述生成一块填充"，你得用语言描述想要什么。Fix 是"从你指定的另一张图里取出你要的部分，合成进来"——你不是在描述，你是在指认。当你对质量有具体要求、已经有心仪素材时，指认比描述靠谱得多。`,
  },
  {
    qEn: "Who owns the result? And what about copyright if I use a real photo as the patch?",
    qZh: "合成结果的版权归谁？我用真实照片作为补丁，会不会有版权风险？",
    aEn:
      "You own the result. But the patch itself is your responsibility — your own photos, licensed images, or CC0 assets are safe. Grabbing someone else's work off the internet as a patch carries real risk — that's not Fix-specific, it's true of any creative workflow.",
    aZh:
      "合成结果的版权归你。但补丁素材的版权由你自己负责——用你自己拍的照片、获授权的图、或明确标注 CC0 的素材是安全的，直接用网上别人的作品作为补丁可能有风险。这不是 Fix 特有的问题，任何创作工作流都一样。",
  },
  {
    qEn: "When does Fix struggle?",
    qZh: "什么时候 Fix 的效果会不好？",
    aEn:
      "When the composition between the main image and the patch is wildly mismatched — say you want to put a horizontal object into a vertical slot, or the patch's light direction is the exact opposite of the main image and the patch has little detail. We'll still improve things, but true seamlessness won't happen. If your patch roughly aligns in structure and light direction with the main image, the result usually holds up.",
    aZh:
      "主图和补丁之间构图匹配度极低的时候——比如你想把一个横躺的物体塞进一个竖立位置，或者补丁的光源方向和主图完全相反且补丁细节很少。这些情况下我们还能改善，但做不到真正无缝。如果你的补丁和主图在大致的结构、光线方向上能对上，结果一般经得起审视。",
  },
  {
    qEn: "Is there a subscription? Can I try it free?",
    qZh: "要订阅吗？有免费试用吗？",
    aEn: "Credits for now — 1 per fix, with a free batch for new users. Subscription later, if you need it.",
    aZh: "现在是积分制——每次合成 1 积分，新用户免费送一批。量大了再聊订阅。",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
              <span className="lang-en">Ready to transplant?</span>
              <span className="lang-zh">准备好做移植了吗？</span>
            </p>
            <h3 className="faq-cta-title">
              <span className="lang-en">Find the one thing wrong. Fix it.</span>
              <span className="lang-zh">找出崩坏的那处，换掉它。</span>
            </h3>
          </div>
          <div className="faq-cta-actions">
            <Link href="/editor" className="button button-primary">
              <span className="lang-en">Try Transplant</span>
              <span className="lang-zh">开始移植</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
