"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const CHIPS = [
  { id: "fx", labelEn: "🔥 Flame effect", labelZh: "🔥 火焰特效", scene: "flame" },
  { id: "prop", labelEn: "🗡️ Prop fusion", labelZh: "🗡️ 道具融合", scene: "prop" },
  { id: "costume", labelEn: "👗 Costume swap", labelZh: "👗 服装替换", scene: "costume" },
]

interface SliderProps {
  beforeSvg: React.ReactNode
  afterSvg: React.ReactNode
  initialPct?: number
  large?: boolean
  cardId?: string
}

function BASlider({ beforeSvg, afterSvg, initialPct = 55, large = false }: SliderProps) {
  const [pct, setPct] = useState(initialPct)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePct = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const newPct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPct(newPct)
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updatePct(e.clientX)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    updatePct(e.touches[0].clientX)
  }

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      updatePct(clientX)
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("touchmove", onMove)
    window.addEventListener("touchend", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onUp)
    }
  }, [isDragging, updatePct])

  const knobSize = large ? 46 : 30
  const pillSize = large ? "10px" : "9.5px"

  return (
    <div
      ref={containerRef}
      className={large ? "ba-slider" : "ba-card-slider"}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Before pane */}
      <div className={large ? "ba-pane" : "ba-card-pane"}>
        {beforeSvg}
      </div>

      {/* After pane */}
      <div
        className={large ? "ba-pane ba-pane-after" : "ba-card-pane ba-card-pane-after"}
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      >
        {afterSvg}
      </div>

      {/* Line */}
      <div
        className={large ? "ba-line" : "ba-card-line"}
        style={{ left: `${pct}%` }}
      />

      {/* Knob */}
      <div
        className={large ? "ba-knob" : "ba-card-knob"}
        style={{ left: `${pct}%`, width: knobSize, height: knobSize }}
      >
        <svg
          width={large ? 18 : 14}
          height={large ? 18 : 14}
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M6.5 3.5 L2.5 9 L6.5 14.5 M11.5 3.5 L15.5 9 L11.5 14.5"
            stroke="#1d1d1f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Before pill */}
      <div
        className={large ? "ba-pill ba-pill-before" : "ba-card-pill ba-card-pill-before"}
        style={{ fontSize: pillSize, padding: large ? "5px 12px" : "3px 9px" }}
      >
        Before · Rough
      </div>

      {/* After pill */}
      <div
        className={large ? "ba-pill ba-pill-after" : "ba-card-pill ba-card-pill-after"}
        style={{ fontSize: pillSize, padding: large ? "5px 12px" : "3px 9px" }}
      >
        After · AI
      </div>
    </div>
  )
}

const beforeFlame = (
  <svg className="ba-scene" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="hb-s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8e8ec" />
        <stop offset="100%" stopColor="#d4d4da" />
      </linearGradient>
      <linearGradient id="hb-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c8c8ce" />
        <stop offset="100%" stopColor="#a8a8b0" />
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#hb-s)" />
    <rect y="620" width="1600" height="280" fill="url(#hb-g)" />
    <g transform="translate(700,230)">
      <rect x="40" y="170" width="120" height="240" rx="14" fill="#4a5568" />
      <ellipse cx="100" cy="120" rx="62" ry="68" fill="#e8c8a0" />
      <path d="M38 100 Q100 55 162 100 L160 135 Q130 120 100 118 Q70 120 40 135 Z" fill="#2a1f1a" />
      <ellipse cx="82" cy="120" rx="6" ry="8" fill="#2a1f1a" />
      <ellipse cx="118" cy="120" rx="6" ry="8" fill="#2a1f1a" />
      <path d="M86 150 Q100 158 114 150" stroke="#8b5e3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="10" y="180" width="34" height="130" rx="16" fill="#e8c8a0" />
      <rect x="156" y="180" width="34" height="130" rx="16" fill="#e8c8a0" />
      <rect x="55" y="400" width="35" height="130" rx="10" fill="#3a4458" />
      <rect x="110" y="400" width="35" height="130" rx="10" fill="#3a4458" />
    </g>
    <g opacity="0.85">
      <rect x="620" y="660" width="360" height="200" rx="10" fill="#f0f0f4" stroke="#d94a1f" strokeWidth="2" strokeDasharray="10 6" />
      <text x="800" y="680" fontFamily="monospace" fontSize="14" fill="#d94a1f" textAnchor="middle" fontWeight="500">rough paste</text>
      <path d="M660 860 Q710 790 760 750 Q800 720 830 750 Q850 780 835 820 Q880 770 910 760 Q940 755 925 800 Q910 830 890 860 Q920 820 950 820 Q980 825 960 860 Z" fill="#e85a1f" opacity="0.7" />
      <path d="M690 860 Q720 810 760 780 Q790 760 810 775 Q822 795 805 835 Z" fill="#f5a835" opacity="0.8" />
    </g>
  </svg>
)

const afterFlame = (
  <svg className="ba-scene" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="ha-s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e0d4c4" />
        <stop offset="100%" stopColor="#c9a88a" />
      </linearGradient>
      <linearGradient id="ha-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b89878" />
        <stop offset="100%" stopColor="#8a6a4e" />
      </linearGradient>
      <radialGradient id="ha-fg" cx="50%" cy="100%" r="55%">
        <stop offset="0%" stopColor="#ff7a2e" stopOpacity="0.55" />
        <stop offset="60%" stopColor="#ff5a1a" stopOpacity="0.18" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <linearGradient id="ha-fl" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#e84a10" />
        <stop offset="45%" stopColor="#ff7a2e" />
        <stop offset="80%" stopColor="#ffb05a" />
        <stop offset="100%" stopColor="#ffe098" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#ha-s)" />
    <rect y="620" width="1600" height="280" fill="url(#ha-g)" />
    <rect width="1600" height="900" fill="url(#ha-fg)" opacity="0.85" />
    <ellipse cx="800" cy="870" rx="380" ry="40" fill="rgba(255,90,26,0.4)" />
    <g transform="translate(700,230)">
      <rect x="40" y="170" width="120" height="240" rx="14" fill="#4e5a6e" />
      <rect x="40" y="300" width="120" height="110" rx="14" fill="rgba(255,110,40,0.2)" />
      <ellipse cx="100" cy="120" rx="62" ry="68" fill="#ead0aa" />
      <path d="M38 100 Q100 55 162 100 L160 135 Q130 120 100 118 Q70 120 40 135 Z" fill="#2a1f1a" />
      <ellipse cx="82" cy="120" rx="6" ry="8" fill="#2a1f1a" />
      <ellipse cx="118" cy="120" rx="6" ry="8" fill="#2a1f1a" />
      <circle cx="84" cy="118" r="2.5" fill="#ff8a3a" opacity="0.7" />
      <circle cx="120" cy="118" r="2.5" fill="#ff8a3a" opacity="0.7" />
      <path d="M86 150 Q100 158 114 150" stroke="#8b5e3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="10" y="180" width="34" height="130" rx="16" fill="#ebd0a8" />
      <rect x="156" y="180" width="34" height="130" rx="16" fill="#ebd0a8" />
      <rect x="55" y="400" width="35" height="140" rx="10" fill="#3e4860" />
      <rect x="110" y="400" width="35" height="140" rx="10" fill="#3e4860" />
      <ellipse cx="72" cy="540" rx="24" ry="14" fill="#2a3040" />
      <ellipse cx="127" cy="540" rx="24" ry="14" fill="#2a3040" />
    </g>
    <path d="M560 900 Q620 810 700 760 Q750 730 795 750 Q830 770 820 820 Q860 750 900 730 Q945 715 940 770 Q935 820 915 870 Q950 800 985 795 Q1030 795 1020 845 Q1050 790 1085 790 Q1130 795 1115 850 Q1135 810 1170 815 Q1210 820 1190 880 Q1210 850 1240 860 Q1270 870 1245 900 Z" fill="url(#ha-fl)" opacity="0.95" />
    <path d="M620 900 Q670 840 720 800 Q755 775 775 795 Q790 820 770 860 Q800 810 830 800 Q860 795 850 835 Q840 870 820 900 Z" fill="#ffe098" opacity="0.6" />
    <path d="M890 900 Q915 850 945 820 Q970 800 980 820 Q988 845 970 880 Z" fill="#ffe098" opacity="0.55" />
    <circle cx="780" cy="720" r="3" fill="#ffe098" opacity="0.85" />
    <circle cx="870" cy="700" r="2.5" fill="#ffc068" opacity="0.8" />
    <circle cx="970" cy="715" r="3" fill="#ffe098" opacity="0.8" />
  </svg>
)

export default function Hero() {
  const [activeChip, setActiveChip] = useState("fx")

  return (
    <section className="ba-hero">
      <div className="ba-hero-bg" />

      <div className="ba-hero-content">
        <div className="ba-hero-eyebrow">
          <span className="ba-dot" />
          <span className="lang-en">AI Image Blending · No design skills needed</span>
          <span className="lang-zh">AI 图像融合 · 无需设计技能</span>
        </div>

        <h1>
          <span className="lang-en">
            Paste it rough.
            <br />
            <em>AI blends it perfectly.</em>
          </span>
          <span className="lang-zh">
            粗略贴进去，
            <br />
            <em>AI 帮你完美融合。</em>
          </span>
        </h1>

        <p className="ba-hero-sub">
          <span className="lang-en">
            Drop an element into your image at roughly the right position. BlendAI <strong>preserves your subject</strong> — then seamlessly blends every edge, shadow, and highlight.
          </span>
          <span className="lang-zh">
            将元素粗略放到图中大致位置，BlendAI <strong>完整保留主体</strong>，然后无缝融合每一处边缘、阴影和高光。
          </span>
        </p>

        <div className="ba-hero-ctas">
          <a href="/editor?demo=true" className="ba-btn-primary">
            <span className="lang-en">Try with demo image →</span>
            <span className="lang-zh">用示例图立即体验 →</span>
          </a>
          <a href="#showcase" className="ba-btn-secondary">
            <span className="lang-en">See examples</span>
            <span className="lang-zh">查看案例</span>
          </a>
        </div>
      </div>

      <div className="ba-hero-showpiece">
        <div className="ba-showpiece-label">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="6" r="2" />
          </svg>
          <span className="lang-en">Live Demo — Drag to compare</span>
          <span className="lang-zh">实时演示 — 拖动滑块对比</span>
        </div>

        <div className="ba-showpiece">
          <BASlider beforeSvg={beforeFlame} afterSvg={afterFlame} initialPct={55} large />

          <div className="ba-showpiece-chips">
            <div className="ba-chip-group">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  className={`ba-chip ${activeChip === chip.id ? "active" : ""}`}
                  onClick={() => setActiveChip(chip.id)}
                >
                  <span className="lang-en">{chip.labelEn}</span>
                  <span className="lang-zh">{chip.labelZh}</span>
                </button>
              ))}
            </div>
            <a href="/editor?demo=true" className="ba-chip-cta">
              <span className="lang-en">Try this example →</span>
              <span className="lang-zh">用此示例体验 →</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
