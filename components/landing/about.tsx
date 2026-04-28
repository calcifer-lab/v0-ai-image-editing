"use client"

const ABOUT_ZH = `关于 ReDiagram

AI 绘图已经能画对 90% 了。剩下的 10%——一个违反物理逻辑的细节、一处过不了审的元素、一个前后不一致的道具——足以让一张图无法投稿、无法上架、无法印刷。

ReDiagram Fix 不是又一个 AI 修图工具。它做一件具体的事:让你从一张参考图里取出对的部分,无缝合成进主图,周围物体产生合理的物理响应,其余分毫不动。

它服务于把 AI 绘图当生产力工具的人——绘本作者、漫画创作者、教育工作者、出版从业者。这些人需要的不是"再抽一张卡",而是"把这一张图修对"。

ReDiagram 还会扩展。面向专业设计师的矢量工具 ReDiagram Vector 即将上线。但每一款工具都遵循同一条原则:保留对的,只改要改的。`

const ABOUT_EN = `About ReDiagram

AI image generation gets 90% of the way there. The remaining 10% — a detail that breaks physics, an element that won't pass review, a prop that doesn't match across panels — is often enough to keep an image from being submitted, shipped, or printed.

ReDiagram Fix isn't another AI image editor. It does one specific thing: pull the right element from a reference image, compose it seamlessly into your main image, and let the surrounding objects respond with the right physics — leaving everything else untouched.

It's built for people who use AI image generation as a working tool — picture book authors, comic creators, educators, publishing professionals. They don't need another reroll. They need this one image to be right.

ReDiagram is expanding. ReDiagram Vector, a vector tool for professional designers, is coming. But every tool follows the same principle: keep what works, change only what needs to.`

export default function About() {
  return (
    <section id="about" className="site-section about-section">
      <div className="site-container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="lang-en">About ReDiagram</span>
            <span className="lang-zh">关于 ReDiagram</span>
          </span>
          <h2 className="section-title">
            <span className="lang-en">About ReDiagram</span>
            <span className="lang-zh">关于 ReDiagram</span>
          </h2>
        </div>

        <div className="about-body">
          <div className="about-text">
            <span className="lang-zh">
              {ABOUT_ZH.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </span>
            <span className="lang-en">
              {ABOUT_EN.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}