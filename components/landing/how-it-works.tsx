"use client"

export default function HowItWorks() {
  return (
    <section id="how">
      <div className="ba-how">
        <div className="ba-how-card">
          <div className="ba-how-step">
            <div className="ba-how-num">01</div>
            <div className="ba-how-title">
              <span className="lang-en">Prepare two images</span>
              <span className="lang-zh">准备两张图</span>
            </div>
            <div className="ba-how-desc">
              <span className="lang-en">Base image + element image.</span>
              <span className="lang-zh">基础图 + 元素图</span>
            </div>
            <span className="ba-how-tag ba-how-tag-you">
              <span className="lang-en">You</span>
              <span className="lang-zh">你来做</span>
            </span>
          </div>

          <div className="ba-how-step">
            <div className="ba-how-num">02</div>
            <div className="ba-how-title">
              <span className="lang-en">Rough-paste it</span>
              <span className="lang-zh">粗略拼接</span>
            </div>
            <div className="ba-how-desc">
              <span className="lang-en">Any tool to paste roughly in place.</span>
              <span className="lang-zh">用任意工具粗略放到目标位置</span>
            </div>
            <span className="ba-how-tag ba-how-tag-you">~2 min</span>
          </div>

          <div className="ba-how-step">
            <div className="ba-how-num">03</div>
            <div className="ba-how-title">
              <span className="lang-en">Instruct the AI</span>
              <span className="lang-zh">指示 AI</span>
            </div>
            <div className="ba-how-desc">
              <span className="lang-en">Mark region and tell AI what to blend.</span>
              <span className="lang-zh">框选区域，告诉 AI 融合什么</span>
            </div>
            <span className="ba-how-tag ba-how-tag-ai">
              <span className="lang-en">AI · ~30 sec</span>
              <span className="lang-zh">AI · 约 30 秒</span>
            </span>
          </div>

          <div className="ba-how-step">
            <div className="ba-how-num">04</div>
            <div className="ba-how-title">
              <span className="lang-en">Download result</span>
              <span className="lang-zh">下载成图</span>
            </div>
            <div className="ba-how-desc">
              <span className="lang-en">Structure preserved, light matched.</span>
              <span className="lang-zh">结构保持、光照匹配</span>
            </div>
            <span className="ba-how-tag ba-how-tag-ai">
              <span className="lang-en">Done</span>
              <span className="lang-zh">完成</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
