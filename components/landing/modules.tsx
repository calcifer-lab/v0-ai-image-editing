"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

type ModuleKey = "core" | "style" | "character"

type UseCase =
  | "Architecture diagrams"
  | "UX wireframes"
  | "Picture books"
  | "Training materials"
  | "Other"

const MODULES = [
  {
    nameEn: "Fix",
    nameZh: "Fix",
    bodyEn:
      "Repair misaligned shapes, broken labels, spacing issues, and inconsistent structure in existing diagrams.",
    bodyZh: "修复现有图表中的错位形状、标签问题、间距错误和结构不一致。",
    statusEn: "AVAILABLE NOW",
    statusZh: "现已可用",
    tone: "available",
    ctaEn: "Try Fix",
    ctaZh: "体验 Fix",
    href: "/editor",
  },
  {
    key: "core" as ModuleKey,
    nameEn: "Core",
    nameZh: "Core",
    bodyEn:
      "A foundational editor for broader diagram construction, revision, and controlled AI-assisted structure changes.",
    bodyZh: "面向更广泛图表构建、修订和可控 AI 结构调整的核心编辑能力。",
    statusEn: "COMING SOON",
    statusZh: "即将推出",
    tone: "soon",
    ctaEn: "Get notified",
    ctaZh: "获取通知",
  },
  {
    key: "style" as ModuleKey,
    nameEn: "Style",
    nameZh: "Style",
    bodyEn:
      "Restyle diagram systems with cleaner typography, spacing rules, palettes, and presentation-ready polish.",
    bodyZh: "通过更清晰的字体、间距规则、配色和展示级润色，统一图表风格。",
    statusEn: "ON ROADMAP",
    statusZh: "路线图中",
    tone: "roadmap",
    ctaEn: "Join early access",
    ctaZh: "加入抢先体验",
  },
  {
    key: "character" as ModuleKey,
    nameEn: "Character",
    nameZh: "Character",
    bodyEn:
      "Maintain recurring illustrated figures and visual characters across diagram-heavy stories and teaching materials.",
    bodyZh: "在图文故事和教学材料中，保持重复出现的人物与视觉角色的一致性。",
    statusEn: "ON ROADMAP",
    statusZh: "路线图中",
    tone: "roadmap",
    ctaEn: "Join early access",
    ctaZh: "加入抢先体验",
  },
]

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'

export default function Modules() {
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null)
  const [email, setEmail] = useState("")
  const [useCase, setUseCase] = useState<UseCase>("Architecture diagrams")
  const [otherUseCase, setOtherUseCase] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const activeModuleData = useMemo(
    () => MODULES.find((module) => "key" in module && module.key === activeModule),
    [activeModule],
  )

  useEffect(() => {
    if (!activeModule) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModule(null)
        return
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return
      }

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [activeModule])

  const closeModal = () => {
    setActiveModule(null)
    setEmail("")
    setUseCase("Architecture diagrams")
    setOtherUseCase("")
  }

  const submitInterest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    console.log("ReDiagram early access signup", {
      module: activeModule,
      email,
      useCase,
      otherUseCase: useCase === "Other" ? otherUseCase : "",
    })

    closeModal()
  }

  return (
    <>
      <section id="modules" className="site-section">
        <div className="site-container">
          <div className="section-head">
            <span className="eyebrow">
              <span className="lang-en">Modules</span>
              <span className="lang-zh">产品模块</span>
            </span>
            <h2 className="section-title">
              <span className="lang-en">Start with Fix. Grow into the full editor.</span>
              <span className="lang-zh">从 Fix 开始，逐步进入完整编辑器。</span>
            </h2>
            <p className="section-copy">
              <span className="lang-en">
                The product is modular on purpose. Fix is live now, while broader editing,
                restyling, and character consistency are rolling out in stages.
              </span>
              <span className="lang-zh">
                产品采用模块化设计。Fix 已上线，更完整的编辑、风格统一和角色一致性能力将分阶段推出。
              </span>
            </p>
          </div>

          <div className="cards-grid modules-grid">
            {MODULES.map((module) => (
              <article key={module.nameEn} className="landing-card module-card">
                <div className="module-status-row">
                  <h3 className="module-title">
                    <span className="lang-en">{module.nameEn}</span>
                    <span className="lang-zh">{module.nameZh}</span>
                  </h3>
                  <span className={`status-badge status-${module.tone}`}>
                    <span className="lang-en">{module.statusEn}</span>
                    <span className="lang-zh">{module.statusZh}</span>
                  </span>
                </div>
                <p className="module-copy">
                  <span className="lang-en">{module.bodyEn}</span>
                  <span className="lang-zh">{module.bodyZh}</span>
                </p>
                {"href" in module ? (
                  <Link href={module.href} className="button button-primary button-sm">
                    <span className="lang-en">{module.ctaEn}</span>
                    <span className="lang-zh">{module.ctaZh}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="button button-ghost button-sm"
                    onClick={() => setActiveModule(module.key)}
                  >
                    <span className="lang-en">{module.ctaEn}</span>
                    <span className="lang-zh">{module.ctaZh}</span>
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeModule && activeModuleData ? (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div
            ref={modalRef}
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="early-access-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">
                  <span className="lang-en">Early access</span>
                  <span className="lang-zh">抢先体验</span>
                </p>
                <h3 id="early-access-title" className="modal-title">
                  <span className="lang-en">Stay updated on {activeModuleData.nameEn}</span>
                  <span className="lang-zh">订阅 {activeModuleData.nameZh} 更新</span>
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={submitInterest}>
              <label className="field">
                <span className="field-label">
                  <span className="lang-en">Email</span>
                  <span className="lang-zh">邮箱</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </label>

              <label className="field">
                <span className="field-label">
                  <span className="lang-en">Use case</span>
                  <span className="lang-zh">使用场景</span>
                </span>
                <select
                  value={useCase}
                  onChange={(event) => setUseCase(event.target.value as UseCase)}
                >
                  <option>Architecture diagrams</option>
                  <option>UX wireframes</option>
                  <option>Picture books</option>
                  <option>Training materials</option>
                  <option>Other</option>
                </select>
              </label>

              {useCase === "Other" ? (
                <label className="field">
                  <span className="field-label">
                    <span className="lang-en">Tell us more</span>
                    <span className="lang-zh">补充说明</span>
                  </span>
                  <input
                    type="text"
                    value={otherUseCase}
                    onChange={(event) => setOtherUseCase(event.target.value)}
                    placeholder="Your workflow"
                  />
                </label>
              ) : null}

              <div className="modal-actions">
                <button type="submit" className="button button-primary">
                  <span className="lang-en">Submit</span>
                  <span className="lang-zh">提交</span>
                </button>
                <button type="button" className="button button-ghost" onClick={closeModal}>
                  <span className="lang-en">Cancel</span>
                  <span className="lang-zh">取消</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
