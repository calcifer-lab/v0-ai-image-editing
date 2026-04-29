"use client"

const STEPS = [
  {
    number: "01",
    titleEn: "Upload two images",
    titleZh: "上传两张图",
    bodyEn:
      "The main image — the one with the problem. And the element image — the one with the correct part you want to extract.",
    bodyZh:
      "主图：那张有问题的图。元素图：包含你想取用的正确元素的图。两张缺一不可。",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        {/* Main image frame */}
        <rect x="40" y="100" width="160" height="200" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="55" y1="165" x2="185" y2="165" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="120,165 140,130 160,165" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="65" y="200" width="18" height="14" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
        <rect x="55" y="275" width="130" height="10" fill="#e94e1b" fillOpacity="0.25" stroke="#E94E1B" strokeWidth="1.5" strokeDasharray="4 2"/>
        <text x="120" y="310" textAnchor="middle" fontSize="11" fill="#E94E1B" fontFamily="sans-serif">main image</text>
        {/* Arrow between */}
        <line x1="210" y1="200" x2="240" y2="200" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="233,195 242,200 233,205" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Element image frame */}
        <rect x="255" y="100" width="110" height="200" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <circle cx="310" cy="170" r="22" fill="none" stroke="#2B5CE6" strokeWidth="2.5"/>
        <line x1="295" y1="220" x2="325" y2="220" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="300,220 310,200 320,220" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
        <text x="310" y="310" textAnchor="middle" fontSize="11" fill="#2B5CE6" fontFamily="sans-serif">element image</text>
        {/* Label for crop circle */}
        <text x="360" y="155" textAnchor="start" fontSize="10" fill="#2B5CE6" fontFamily="sans-serif">crop this</text>
      </svg>
    ),
  },
  {
    number: "02",
    titleEn: "Select source and target",
    titleZh: "选来源，选目标",
    bodyEn:
      "Draw a region on the element image to extract. Then draw the target area on the main image where it should go.",
    bodyZh:
      "在元素图上框出要提取的区域，再在主图上圈出要替换进去的位置。",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        {/* Main image */}
        <rect x="40" y="100" width="160" height="200" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="55" y1="165" x2="185" y2="165" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="120,165 140,130 160,165" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="65" y="200" width="18" height="14" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
        {/* Target region on main */}
        <rect x="90" y="220" width="70" height="60" fill="#E94E1B" fillOpacity="0.2" stroke="#E94E1B" strokeWidth="2" strokeDasharray="5 3"/>
        <text x="125" y="345" textAnchor="middle" fontSize="10" fill="#E94E1B" fontFamily="sans-serif">target region</text>
        {/* Arrow */}
        <line x1="210" y1="200" x2="240" y2="200" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="233,195 242,200 233,205" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Element image */}
        <rect x="255" y="100" width="110" height="200" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="295" y1="220" x2="325" y2="220" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="300,220 310,200 320,220" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
        {/* Source crop on element */}
        <circle cx="310" cy="170" r="22" fill="#2B5CE6" fillOpacity="0.2" stroke="#2B5CE6" strokeWidth="2.5"/>
        <text x="380" y="155" textAnchor="start" fontSize="10" fill="#2B5CE6" fontFamily="sans-serif">crop</text>
        {/* Connector line from source to target */}
        <path d="M 332 170 Q 200 170 90 250" fill="none" stroke="#2B5CE6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <polyline points="86,243 92,252 100,245" fill="none" stroke="#2B5CE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    number: "03",
    titleEn: "AI Blend",
    titleZh: "AI 合成",
    bodyEn:
      "One tap. The element is transplanted — style, lighting, and edges all align automatically.",
    bodyZh:
      "一键完成。元素移植进去，风格、光影、边缘自动对齐，看不出拼接。",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        {/* Main image with blended region */}
        <rect x="80" y="100" width="240" height="200" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="95" y1="165" x2="305" y2="165" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="200,165 220,130 240,165" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="105" y="200" width="18" height="14" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
        {/* Blended element area (subtle highlight) */}
        <rect x="160" y="220" width="70" height="60" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"/>
        {/* Checkmark */}
        <circle cx="340" cy="80" r="18" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="2"/>
        <polyline points="332,80 338,86 350,74" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="200" y="330" textAnchor="middle" fontSize="11" fill="#22c55e" fontFamily="sans-serif">element transplanted</text>
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="site-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">How it works</span>
            <span className="lang-zh">工作原理</span>
          </span>
          <h2 className="section-title">
            <span className="lang-en">Three steps. One transplant.</span>
            <span className="lang-zh">三步，完成一次移植。</span>
          </h2>
        </div>

        <div className="how-steps">
          {STEPS.map((step, index) => (
            <div key={step.number} className="how-step">
              <div className="how-step-media">
                {step.svg}
              </div>
              <div className="how-step-content">
                <span className="how-step-number">{step.number}</span>
                <h3 className="how-step-title">
                  <span className="lang-en">{step.titleEn}</span>
                  <span className="lang-zh">{step.titleZh}</span>
                </h3>
                <p className="how-step-body">
                  <span className="lang-en">{step.bodyEn}</span>
                  <span className="lang-zh">{step.bodyZh}</span>
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div className="how-step-arrow" aria-hidden="true">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
