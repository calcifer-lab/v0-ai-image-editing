"use client"

import Link from "next/link"
import BeforeAfter from "@/components/BeforeAfter"

const FEATURES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titleEn: "Surgical precision",
    titleZh: "精准手术",
    bodyEn: "Replace only what&apos;s broken. Everything else — untouched.",
    bodyZh: "只换崩坏的那一处。其余一分一毫不动。",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    titleEn: "Automatic alignment",
    titleZh: "自动对齐",
    bodyEn: "Style, lighting, and edges align on their own.",
    bodyZh: "风格、光影、边缘，系统自动对齐。",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    titleEn: "Any element, any image",
    titleZh: "任意元素，任意图片",
    bodyEn: "From another AI image, a photo, or any source you choose.",
    bodyZh: "来自另一张 AI 图、真实照片，或任何你指定的素材。",
  },
]

export default function Features() {
  return (
    <section id="features" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">Why it works</span>
            <span className="lang-zh">为什么有效</span>
          </span>
          <h2 className="section-title">
            <span className="lang-en">Organ transplant for AI images.</span>
            <span className="lang-zh">AI 图片的器官移植。</span>
          </h2>
          <p className="section-subtitle">
            <span className="lang-en">
              Most AI image tools let you regenerate. We let you replace —
              with exactly the element you already have.
            </span>
            <span className="lang-zh">
              大多数 AI 图片工具让你重新生成。我们让你替换——
              用你已有的正确元素，精准换进去。
            </span>
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div key={feature.titleEn} className="feature-item">
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="feature-title">
                <span className="lang-en">{feature.titleEn}</span>
                <span className="lang-zh">{feature.titleZh}</span>
              </h3>
              <p className="feature-body">
                <span className="lang-en">{feature.bodyEn}</span>
                <span className="lang-zh">{feature.bodyZh}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
