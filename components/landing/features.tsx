"use client"

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    titleEn: "Preserves subject",
    titleZh: "保留主体",
    descEn: "Your subject stays intact — identity, pose, outfit, and all distinguishing details.",
    descZh: "你的主体完整保留 — 身份、姿态、服装和所有特征细节。",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
    titleEn: "Auto light matching",
    titleZh: "自动光照匹配",
    descEn: "AI analyzes the target scene and adjusts lighting, color temperature, and shadow direction.",
    descZh: "AI 分析目标场景，自动调节光照、色温和阴影方向。",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    titleEn: "Style consistency",
    titleZh: "风格一致",
    descEn: "Matches texture grain, noise levels, and art direction for a cohesive final image.",
    descZh: "匹配纹理颗粒、噪点水平和艺术方向，确保最终图像风格统一。",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    titleEn: "~30 second results",
    titleZh: "约 30 秒出图",
    descEn: "Direct paste mode processes in ~5 seconds. AI blending completes in ~30 seconds.",
    descZh: "直接粘贴模式约 5 秒出图。AI 融合模式约 30 秒完成。",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    titleEn: "Privacy first",
    titleZh: "隐私优先",
    descEn: "All processing happens in your browser. Images are never uploaded or stored on any server.",
    descZh: "所有处理都在浏览器中完成。图片不会上传或存储在任何服务器上。",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    titleEn: "Runs in the browser",
    titleZh: "浏览器运行",
    descEn: "No downloads, no installations. Works on desktop and mobile browsers alike.",
    descZh: "无需下载，无需安装。在桌面和移动浏览器上均可使用。",
  },
]

export default function Features() {
  return (
    <section id="features" className="ba-section">
      <div className="ba-sec-inner">
        <div className="ba-sec-eyebrow">
          <span className="lang-en">Features</span>
          <span className="lang-zh">功能特点</span>
        </div>
        <h2 className="ba-sec-title">
          <span className="lang-en">Everything you need</span>
          <span className="lang-zh">所需的一切</span>
        </h2>
        <p className="ba-sec-sub">
          <span className="lang-en">Powerful capabilities, no complexity.</span>
          <span className="lang-zh">强大的功能，简洁的操作。</span>
        </p>

        <div className="ba-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="ba-feature">
              <div className="ba-feature-icon" style={{ color: "var(--ba-ink-2)" }}>
                {f.icon}
              </div>
              <h3>
                <span className="lang-en">{f.titleEn}</span>
                <span className="lang-zh">{f.titleZh}</span>
              </h3>
              <p>
                <span className="lang-en">{f.descEn}</span>
                <span className="lang-zh">{f.descZh}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
