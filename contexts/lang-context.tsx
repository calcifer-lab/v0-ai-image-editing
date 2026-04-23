"use client"

import { createContext, useContext, useState, useEffect } from "react"

type Lang = "en" | "zh"

interface LangContextType {
  lang: Lang
  toggleLang: () => void
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  toggleLang: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en")

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const toggleLang = () => {
    setLang((prev) => (prev === "en" ? "zh" : "en"))
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
