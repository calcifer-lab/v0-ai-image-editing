"use client"

import { useLang } from "@/contexts/lang-context"

export default function LangToggleFixed() {
  const { lang, toggleLang } = useLang()

  return (
    <button
      type="button"
      className="lang-toggle-fixed"
      onClick={toggleLang}
      aria-label={lang === "en" ? "Switch to Chinese" : "Switch to English"}
    >
      <span className="lang-en">中文</span>
      <span className="lang-zh">EN</span>
    </button>
  )
}
