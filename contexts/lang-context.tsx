"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Lang = "en" | "zh"

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const STORAGE_KEY = "rediagram.lang"

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
})

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "zh" ? "zh" : "en"
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  // Hydrate from localStorage after mount. SSR always renders `en` to avoid a
  // hydration mismatch; the swap to the persisted value happens client-side.
  useEffect(() => {
    setLangState(readStoredLang())
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next: Lang) => {
    setLangState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }

  const toggleLang = () => setLang(lang === "en" ? "zh" : "en")

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
