"use client"

import { LangProvider } from "@/contexts/lang-context"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>
}
