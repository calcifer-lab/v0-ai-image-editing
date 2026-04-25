"use client"

import { useLang } from "@/contexts/lang-context"

export default function LangToggleFixed() {
  const { lang, toggleLang } = useLang()

  return (
    <button
      type="button"
      className="lang-toggle-fixed"
      onClick={toggleLang}
      aria-label={lang === "en" ? "切换到中文" : "Switch to English"}
    >
      {lang === "en" ? "中文" : "EN"}
    </button>
  )
}
