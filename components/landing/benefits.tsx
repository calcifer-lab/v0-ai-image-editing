"use client"

import { useState, useRef, useCallback, useEffect } from "react"

function CardSlider({ beforeSvg, afterSvg }: { beforeSvg: React.ReactNode; afterSvg: React.ReactNode }) {
  const [pct, setPct] = useState(50)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const update = useCallback((cx: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPct(Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)))
  }, [])

  const onDown = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true); update(e.clientX) }
  const onTouchStart = (e: React.TouchEvent) => { setDragging(true); update(e.touches[0].clientX) }

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent | TouchEvent) => update("touches" in e ? e.touches[0].clientX : e.clientX)
    const up = () => setDragging(false)
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    window.addEventListener("touchmove", move)
    window.addEventListener("touchend", up)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
      window.removeEventListener("touchmove", move)
      window.removeEventListener("touchend", up)
    }
  }, [dragging, update])

  return (
    <div ref={ref} className="ba-card-slider" onMouseDown={onDown} onTouchStart={onTouchStart}>
      <div className="ba-card-pane">{beforeSvg}</div>
      <div className="ba-card-pane ba-card-pane-after" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>{afterSvg}</div>
      <div className="ba-card-line" style={{ left: `${pct}%` }} />
      <div className="ba-card-knob" style={{ left: `${pct}%` }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
          <path d="M6.5 3.5 L2.5 9 L6.5 14.5 M11.5 3.5 L15.5 9 L11.5 14.5" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="ba-card-pill ba-card-pill-before">Before</div>
      <div className="ba-card-pill ba-card-pill-after">After · AI</div>
    </div>
  )
}

const svgBase = { width: "100%", height: "100%", display: "block" }

const groundFlame = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#d8d8dc" /><rect y="200" width="400" height="100" fill="#b0b0b8" />
      <rect x="140" y="80" width="120" height="150" rx="10" fill="#7a8a9a" />
      <ellipse cx="200" cy="65" rx="40" ry="45" fill="#e8c8a8" />
      <path d="M160 50 Q200 20 240 50 L238 75 Q220 68 200 66 Q180 68 162 75 Z" fill="#3a2a1a" />
      <rect x="80" y="210" width="240" height="60" rx="6" fill="#f0f0f4" stroke="#c00" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="200" y="232" fontFamily="monospace" fontSize="9" fill="#c00" textAnchor="middle">rough paste</text>
      <path d="M100 270 Q140 230 180 210 Q200 200 220 210 Q240 220 230 250 Q260 220 280 215 Q300 212 295 240 Q290 265 270 280 Q290 255 310 253 Q330 255 320 280 Z" fill="#e05020" opacity="0.65" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <defs>
        <linearGradient id="gffg" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#e04010" /><stop offset="50%" stopColor="#ff7020" /><stop offset="100%" stopColor="#ffc060" stopOpacity="0.4" /></linearGradient>
        <radialGradient id="gfag" cx="50%" cy="100%" r="50%"><stop offset="0%" stopColor="#ff6020" stopOpacity="0.4" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <rect width="400" height="300" fill="#d0ccc4" /><rect y="200" width="400" height="100" fill="#a09890" />
      <rect width="400" height="300" fill="url(#gfag)" />
      <rect x="140" y="80" width="120" height="150" rx="10" fill="#8a9aaa" />
      <rect x="140" y="170" width="120" height="60" rx="10" fill="rgba(255,100,30,0.15)" />
      <ellipse cx="200" cy="65" rx="40" ry="45" fill="#e8c8a8" />
      <path d="M160 50 Q200 20 240 50 L238 75 Q220 68 200 66 Q180 68 162 75 Z" fill="#3a2a1a" />
      <ellipse cx="190" cy="63" rx="4" ry="5" fill="#2a1a0a" /><ellipse cx="210" cy="63" rx="4" ry="5" fill="#2a1a0a" />
      <path d="M60 300 Q100 240 140 210 Q170 190 195 205 Q215 218 200 248 Q245 205 275 200 Q305 198 298 228 Q292 255 268 280 Q295 245 322 242 Q348 243 338 272 Q355 245 375 245 Q400 248 390 280 Z" fill="url(#gffg)" />
      <ellipse cx="200" cy="295" rx="120" ry="14" fill="rgba(255,90,20,0.3)" />
    </svg>
  ),
}

const magicAura = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#c8c8d4" /><rect y="220" width="400" height="80" fill="#a8a8b8" />
      <g transform="translate(160,60)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#5a4a3a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#4a3020" /><rect x="0" y="80" width="14" height="50" rx="7" fill="#e8c8a8" /><rect x="66" y="80" width="14" height="50" rx="7" fill="#e8c8a8" /></g>
      <rect x="80" y="230" width="240" height="50" rx="5" fill="#f0f0f4" stroke="#9060c0" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="250" fontFamily="monospace" fontSize="9" fill="#9060c0" textAnchor="middle">rough paste</text>
      <ellipse cx="200" cy="180" rx="60" ry="50" fill="#c080ff" opacity="0.3" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <defs><radialGradient id="gmag" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#d090ff" stopOpacity="0.5" /><stop offset="70%" stopColor="#8040dd" stopOpacity="0.15" /><stop offset="100%" stopColor="transparent" /></radialGradient><radialGradient id="gmbg" cx="50%" cy="100%" r="50%"><stop offset="0%" stopColor="#c070ff" stopOpacity="0.3" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
      <rect width="400" height="300" fill="#c0b8cc" /><rect y="220" width="400" height="80" fill="#9890a8" />
      <rect width="400" height="300" fill="url(#gmag)" />
      <g transform="translate(160,60)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#6a5a4a" /><rect x="20" y="120" width="40" height="50" rx="6" fill="rgba(160,80,255,0.18)" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#4a3020" /><rect x="0" y="80" width="14" height="50" rx="7" fill="#e0c8a8" /><rect x="66" y="80" width="14" height="50" rx="7" fill="#e0c8a8" />
        {[0,40,80,120,160,200,240,280,320,360].map(a => (
          <line key={a} x1={40+55*Math.cos(a*Math.PI/180)} y1={80+55*Math.sin(a*Math.PI/180)} x2={40+72*Math.cos(a*Math.PI/180)} y2={80+72*Math.sin(a*Math.PI/180)} stroke="#d0a0ff" strokeWidth="1.5" opacity="0.7" />
        ))}
      </g>
      <ellipse cx="200" cy="300" rx="100" ry="20" fill="url(#gmbg)" />
    </svg>
  ),
}

const lightningAura = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#1a1a2e" /><rect y="220" width="400" height="80" fill="#12122a" />
      <g transform="translate(160,60)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#3a4a5a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#d8b898" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#2a1a0a" /></g>
      <rect x="80" y="230" width="240" height="50" rx="5" fill="#f0f0f4" stroke="#60c0ff" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="250" fontFamily="monospace" fontSize="9" fill="#60c0ff" textAnchor="middle">rough paste</text>
      <path d="M195 80 L210 160 L190 160 L220 240" stroke="#80d8ff" strokeWidth="3" fill="none" opacity="0.5" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <defs><radialGradient id="glag" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#80d8ff" stopOpacity="0.5" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
      <rect width="400" height="300" fill="#181828" /><rect y="220" width="400" height="80" fill="#101020" />
      <rect width="400" height="300" fill="url(#glag)" />
      <g transform="translate(160,60)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#3a4a5a" /><rect x="20" y="110" width="40" height="60" rx="6" fill="rgba(80,200,255,0.15)" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#d8b898" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#2a1a0a" />
        {[0,45,90,135,180,225,270,315].map(a => (
          <line key={a} x1={40+48*Math.cos(a*Math.PI/180)} y1={80+48*Math.sin(a*Math.PI/180)} x2={40+62*Math.cos(a*Math.PI/180)} y2={80+62*Math.sin(a*Math.PI/180)} stroke="#a0e8ff" strokeWidth="1.2" opacity="0.8" />
        ))}
      </g>
      <path d="M195 60 L210 140 L188 140 L218 230" stroke="#80d8ff" strokeWidth="2.5" fill="none" opacity="0.9" />
      <circle cx="200" cy="150" r="3" fill="#fff" opacity="0.9" /><circle cx="205" cy="190" r="2" fill="#80d8ff" opacity="0.7" />
    </svg>
  ),
}

const weaponInHand = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#c8c4b8" /><rect y="200" width="400" height="100" fill="#a8a498" />
      <g transform="translate(160,60)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#4a5a6a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
      <rect x="80" y="210" width="240" height="60" rx="5" fill="#f0f0f4" stroke="#606" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="232" fontFamily="monospace" fontSize="9" fill="#606" textAnchor="middle">rough paste</text>
      <rect x="220" y="80" width="12" height="120" rx="3" fill="#888" opacity="0.6" /><path d="M220 80 L226 60 L232 80" fill="#aaa" opacity="0.6" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#c0bcb0" /><rect y="200" width="400" height="100" fill="#a09a8e" />
      <g transform="translate(160,60)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#4a5a6a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /><rect x="55" y="90" width="10" height="80" rx="2" fill="#6a6a7a" /><path d="M55 90 L60 65 L65 90" fill="#8a8a9a" /><rect x="54" y="88" width="12" height="6" rx="1" fill="#4a4a5a" /></g>
    </svg>
  ),
}

const wingAttachment = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#b8c8d8" /><rect y="210" width="400" height="90" fill="#8a9aaa" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#5a4a3a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
      <rect x="80" y="220" width="240" height="60" rx="5" fill="#f0f0f4" stroke="#008" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="242" fontFamily="monospace" fontSize="9" fill="#008" textAnchor="middle">rough paste</text>
      <ellipse cx="130" cy="130" rx="60" ry="30" fill="#c0c0d0" opacity="0.5" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#b0c0d0" /><rect y="210" width="400" height="90" fill="#8090a0" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#5a4a3a" />
        <path d="M20 110 Q-30 80 -50 40 Q-20 70 10 100 Q-10 60 -40 30 Q-5 65 5 105 Z" fill="#e0e8f0" opacity="0.9" />
        <path d="M60 110 Q110 80 130 40 Q100 70 70 100 Q90 60 120 30 Q95 65 85 105 Z" fill="#e0e8f0" opacity="0.9" />
        <ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
    </svg>
  ),
}

const headgear = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#d8c8b8" /><rect y="210" width="400" height="90" fill="#b8a898" />
      <g transform="translate(170,90)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#4a3a2a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#2a1a0a" /></g>
      <rect x="80" y="220" width="240" height="60" rx="5" fill="#f0f0f4" stroke="#880" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="242" fontFamily="monospace" fontSize="9" fill="#880" textAnchor="middle">rough paste</text>
      <rect x="155" y="20" width="70" height="35" rx="4" fill="#c0a030" opacity="0.6" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#d0c0b0" /><rect y="210" width="400" height="90" fill="#b0a090" />
      <g transform="translate(170,90)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#4a3a2a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#2a1a0a" />
        <path d="M10 38 Q40 -5 70 38 Q65 30 40 25 Q15 30 10 38 Z" fill="#c8a020" />
        <rect x="38" y="5" width="4" height="20" fill="#dab030" /><circle cx="40" cy="2" r="4" fill="#e0c040" /></g>
    </svg>
  ),
}

const fullOutfit = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#e0d8cc" /><rect y="200" width="400" height="100" fill="#c0b8a8" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#2a3a2a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
      <rect x="80" y="220" width="240" height="60" rx="5" fill="#f0f0f4" stroke="#006" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="242" fontFamily="monospace" fontSize="9" fill="#006" textAnchor="middle">rough paste</text>
      <rect x="155" y="160" width="70" height="90" rx="4" fill="#3a5a8a" opacity="0.7" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#d8d0c4" /><rect y="200" width="400" height="100" fill="#b8b0a0" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#2a4a3a" /><rect x="18" y="78" width="44" height="92" rx="8" fill="rgba(50,120,180,0.15)" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
    </svg>
  ),
}

const armorEquip = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#c8c0b0" /><rect y="200" width="400" height="100" fill="#a8a098" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#5a4a3a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
      <rect x="80" y="220" width="240" height="60" rx="5" fill="#f0f0f4" stroke="#606060" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="242" fontFamily="monospace" fontSize="9" fill="#606060" textAnchor="middle">rough paste</text>
      <rect x="155" y="80" width="70" height="90" rx="4" fill="#888" opacity="0.6" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#c0b8a8" /><rect y="200" width="400" height="100" fill="#a09888" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#5a4a3a" /><rect x="15" y="75" width="50" height="95" rx="8" fill="rgba(120,120,140,0.2)" /><path d="M15 85 L40 75 L65 85 L65 120 L40 130 L15 120 Z" fill="rgba(100,100,120,0.25)" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#e8c8a8" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#3a2a1a" /></g>
    </svg>
  ),
}

const cape = {
  before: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#1a1a1a" /><rect y="200" width="400" height="100" fill="#0a0a0a" />
      <g transform="translate(170,70)"><rect x="20" y="80" width="40" height="90" rx="6" fill="#3a2a1a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#d0b090" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#2a1a0a" /></g>
      <rect x="80" y="220" width="240" height="60" rx="5" fill="#f0f0f4" stroke="#300" strokeWidth="1.5" strokeDasharray="6 4" /><text x="200" y="242" fontFamily="monospace" fontSize="9" fill="#300" textAnchor="middle">rough paste</text>
      <rect x="155" y="80" width="70" height="100" rx="4" fill="#400010" opacity="0.7" />
    </svg>
  ),
  after: (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={svgBase}>
      <rect width="400" height="300" fill="#141414" /><rect y="200" width="400" height="100" fill="#0a0a0a" />
      <g transform="translate(170,70)"><path d="M20 80 Q0 120 -10 200 L65 200 Q55 120 60 80 Z" fill="rgba(100,10,30,0.85)" /><rect x="20" y="80" width="40" height="90" rx="6" fill="#3a2a1a" /><ellipse cx="40" cy="50" rx="28" ry="32" fill="#d0b090" /><path d="M12 38 Q40 12 68 38 L66 55 Q52 48 40 46 Q28 48 14 55 Z" fill="#2a1a0a" /></g>
    </svg>
  ),
}

type TabId = "fx" | "prop" | "costume" | "scene"

const TABS: { id: TabId; labelEn: string; labelZh: string; emoji: string }[] = [
  { id: "fx", labelEn: "Flame & FX", labelZh: "火焰特效", emoji: "🔥" },
  { id: "prop", labelEn: "Props", labelZh: "道具融合", emoji: "🗡️" },
  { id: "costume", labelEn: "Costume", labelZh: "服装替换", emoji: "👗" },
  { id: "scene", labelEn: "Scene", labelZh: "场景放置", emoji: "🏞️" },
]

const DESCS: Record<TabId, { en: string; zh: string }> = {
  fx: {
    en: "Add fire, energy aura, or magic effects — AI matches ambient light and casts realistic shadows.",
    zh: "添加火焰、能量光环或魔法特效 —— AI 自动匹配环境光照。",
  },
  prop: {
    en: "Place weapons, wings, headgear, or any object onto your subject — AI handles perspective and lighting.",
    zh: "将武器、翅膀、头饰或任何物体放置到主体上 —— AI 处理透视和光照。",
  },
  costume: {
    en: "Swap outfits, add armor, or drape a cape — AI preserves the subject while changing clothing.",
    zh: "替换服装、添加盔甲或披上斗篷 —— AI 在改变衣着的同时保留主体。",
  },
  scene: {
    en: "Place your subject in a new environment. Background replacement with full lighting and depth.",
    zh: "将主体放入新环境。背景替换，配合完整光照和景深。",
  },
}

const FX_CASES = [
  { titleEn: "Ground flame summoning", titleZh: "地面火焰召唤", descEn: "Fire erupts beneath feet with realistic ground interaction.", descZh: "火焰从脚底喷发，与地面有真实交互。", prompt: "Fire erupting from ground", ...groundFlame },
  { titleEn: "Magic aura effect", titleZh: "魔法光环特效", descEn: "Mystical purple energy surrounds the entire character.", descZh: "神秘紫色能量环绕角色全身。", prompt: "Purple magic aura", ...magicAura },
  { titleEn: "Electric lightning aura", titleZh: "雷电光环特效", descEn: "Crackling electric energy forms an intense corona.", descZh: "噼啪作响的电流形成强烈电晕。", prompt: "Electric lightning aura", ...lightningAura },
]

const PROP_CASES = [
  { titleEn: "Weapon in hand", titleZh: "手持武器", descEn: "Sword appears held naturally in the character's grip.", descZh: "剑自然地出现在角色手中。", prompt: "Sword in hand", ...weaponInHand },
  { titleEn: "Wing attachment", titleZh: "翅膀附着", descEn: "Angelic wings sproutfrom the character's back with perfect perspective.", descZh: "天使翅膀从背后展开，透视完美。", prompt: "Angel wings", ...wingAttachment },
  { titleEn: "Headgear placement", titleZh: "头饰放置", descEn: "Crown sits naturally atop the character's head.", descZh: "皇冠自然地戴在角色头顶。", prompt: "Crown on head", ...headgear },
]

const COSTUME_CASES = [
  { titleEn: "Full outfit swap", titleZh: "全套服装替换", descEn: "Completely changes the character's clothing.", descZh: "完全改变角色的服装。", prompt: "Different outfit", ...fullOutfit },
  { titleEn: "Armor equipment", titleZh: "盔甲装备", descEn: "Adds realistic plate armor over the base outfit.", descZh: "在身上添加写实的板甲。", prompt: "Plate armor", ...armorEquip },
  { titleEn: "Cloak / Cape", titleZh: "斗篷 / 披风", descEn: "Dark flowing cape drapes dramatically over the character.", descZh: "深色飘动斗篷戏剧性地披在角色身上。", prompt: "Dark flowing cape", ...cape },
]

function CaseCard({ caseData }: { caseData: typeof FX_CASES[0] }) {
  return (
    <div className="ba-case-card">
      <CardSlider beforeSvg={caseData.before} afterSvg={caseData.after} />
      <div className="ba-card-body">
        <h3>
          <span className="lang-en">{caseData.titleEn}</span>
          <span className="lang-zh">{caseData.titleZh}</span>
        </h3>
        <p>
          <span className="lang-en">{caseData.descEn}</span>
          <span className="lang-zh">{caseData.descZh}</span>
        </p>
        <span className="ba-card-prompt">{caseData.prompt}</span>
      </div>
    </div>
  )
}

export default function Benefits() {
  const [activeTab, setActiveTab] = useState<TabId>("fx")

  const cases = activeTab === "fx" ? FX_CASES : activeTab === "prop" ? PROP_CASES : activeTab === "costume" ? COSTUME_CASES : null

  return (
    <section id="showcase" className="ba-section">
      <div className="ba-sec-inner">
        <div className="ba-sec-eyebrow">
          <span className="lang-en">Showcase</span>
          <span className="lang-zh">案例展示</span>
        </div>
        <h2 className="ba-sec-title">
          <span className="lang-en">See what BlendAI <em>can do</em></span>
          <span className="lang-zh">看看 BlendAI <em>能做什么</em></span>
        </h2>
        <p className="ba-sec-sub">
          <span className="lang-en">Drag each slider to compare the rough paste with the AI-blended result.</span>
          <span className="lang-zh">拖动每张卡片滑块，对比粗贴与 AI 融合效果。</span>
        </p>

        <div className="ba-cat-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ba-cat-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.emoji}{" "}
              <span className="lang-en">{tab.labelEn}</span>
              <span className="lang-zh">{tab.labelZh}</span>
            </button>
          ))}
        </div>

        <div className="ba-cat-desc">
          <span className="lang-en">{DESCS[activeTab].en}</span>
          <span className="lang-zh">{DESCS[activeTab].zh}</span>
        </div>

        {cases ? (
          <div className="ba-cases-panel active">
            <div className="ba-cards-grid">
              {cases.map((c, i) => <CaseCard key={i} caseData={c} />)}
            </div>
          </div>
        ) : (
          <div className="ba-coming-soon">
            <span className="lang-en">Scene Placement — Coming soon</span>
            <span className="lang-zh">场景放置 — 即将推出</span>
          </div>
        )}
      </div>
    </section>
  )
}
