"use client"

import { useState } from "react"

const FAQS = [
  {
    qEn: "Which image formats are supported?",
    qZh: "支持哪些图片格式？",
    aEn: "PNG, JPG, and JPEG are supported. For best quality and largest file size, we recommend images under 10MB.",
    aZh: "支持 PNG、JPG 和 JPEG 格式。为获得最佳质量和最大文件尺寸，建议使用 10MB 以下的图片。",
  },
  {
    qEn: "What is the difference between Direct and AI modes?",
    qZh: "直接模式和 AI 模式有什么区别？",
    aEn: "Direct mode copies elements exactly without modification — useful for simple compositions. AI mode analyzes the scene and blends edges, matches lighting, and adjusts color to produce a seamless result.",
    aZh: "直接模式原样复制元素不做修改——适合简单合成。AI 模式则分析场景，融合边缘、匹配光照并调整色彩，以产生无缝的效果。",
  },
  {
    qEn: "How long does processing take?",
    qZh: "处理需要多长时间？",
    aEn: "Direct paste mode typically completes in 5–10 seconds. AI blending mode usually takes 20–60 seconds depending on image size and complexity.",
    aZh: "直接粘贴模式通常 5–10 秒完成。AI 融合模式根据图片大小和复杂度，一般需要 20–60 秒。",
  },
  {
    qEn: "Are my images stored on your servers?",
    qZh: "我的图片会存储在你们的服务器上吗？",
    aEn: "No. All processing happens locally in your browser using WebGPU. Images are never uploaded to or stored on any server.",
    aZh: "不会。所有处理都在你的浏览器中通过 WebGPU 本地完成。图片绝不会上传或存储在任何服务器上。",
  },
  {
    qEn: "Can I use BlendAI on mobile?",
    qZh: "我可以在手机上使用 BlendAI 吗？",
    aEn: "Yes. BlendAI works in any modern browser on desktop and mobile. For the best experience, we recommend a desktop browser with a larger screen for precise region selection.",
    aZh: "可以。BlendAI 在桌面和移动浏览器的任何现代浏览器中都能运行。为获得最佳体验，建议使用桌面浏览器，屏幕更大，选择区域更精确。",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="ba-section">
      <div className="ba-sec-inner">
        <div className="ba-sec-eyebrow">FAQ</div>
        <h2 className="ba-sec-title">
          <span className="lang-en">Common questions</span>
          <span className="lang-zh">常见问题</span>
        </h2>

        <div className="ba-faq-wrap">
          <div className="ba-faq">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i
              return (
                <div key={i} className={`ba-faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    className="ba-faq-btn"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span>
                      <span className="lang-en">{faq.qEn}</span>
                      <span className="lang-zh">{faq.qZh}</span>
                    </span>
                    <span className="ba-faq-btn-icon">+</span>
                  </button>
                  <div className="ba-faq-answer">
                    <span className="lang-en">{faq.aEn}</span>
                    <span className="lang-zh">{faq.aZh}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
