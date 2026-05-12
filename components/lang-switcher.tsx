"use client"

import { Check, Globe } from "lucide-react"

import { useLang } from "@/contexts/lang-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const LABEL: Record<"en" | "zh", string> = {
  en: "EN",
  zh: "中文",
}

export default function LangSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={lang === "en" ? "Switch language" : "切换语言"}
          className="inline-flex items-center gap-1.5 rounded-full border border-black/25 bg-white px-3 py-1.5 text-xs font-medium text-[#0a0a0a] transition-colors hover:bg-[#f7f7f5]"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{LABEL[lang]}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[136px]">
        <LangItem value="en" current={lang} label="English" onSelect={setLang} />
        <LangItem value="zh" current={lang} label="中文" onSelect={setLang} />
      </PopoverContent>
    </Popover>
  )
}

function LangItem({
  value,
  current,
  label,
  onSelect,
}: {
  value: "en" | "zh"
  current: "en" | "zh"
  label: string
  onSelect: (lang: "en" | "zh") => void
}) {
  const selected = value === current
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-[#f7f7f5]",
        selected ? "text-[#0a0a0a]" : "text-[#6b6b68]",
      )}
    >
      <span>{label}</span>
      {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  )
}
