import type { Metadata } from "next"
import Link from "next/link"
import BrandMark from "@/components/brand-mark"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo"
import { AppleSilicon } from "./_components/AppleSilicon"
import { CloudPreview } from "./_components/CloudPreview"
import { Disclaimer } from "./_components/Disclaimer"
import { Faq, faqItems } from "./_components/Faq"
import { HardwarePlanner } from "./_components/HardwarePlanner"
import { HardwareScenarios } from "./_components/HardwareScenarios"
import { Hero } from "./_components/Hero"
import { LlamaCppCard } from "./_components/LlamaCppCard"
import { LMStudioCard } from "./_components/LMStudioCard"
import { LocalVsCloud } from "./_components/LocalVsCloud"
import { LocalBenchmarkEmpty } from "./_components/LocalBenchmarkEmpty"
import { OfficialBenchmark } from "./_components/OfficialBenchmark"
import { OfficialSpecs } from "./_components/OfficialSpecs"
import { OllamaCard } from "./_components/OllamaCard"
import { Quantization } from "./_components/Quantization"
import { QuickAnswer } from "./_components/QuickAnswer"
import { RunLocally } from "./_components/RunLocally"
import { SetupAssistantVision } from "./_components/SetupAssistantVision"
import { StatusTable } from "./_components/StatusTable"
import { VramPlanning } from "./_components/VramPlanning"

const path = "/qwen-3-8-27b"
const pageUrl = `${SITE_URL}${path}`
const title = "Qwen 3.8 27B Hardware Requirements, VRAM & Local Setup"
const description =
  "Run Qwen 3.8 27B locally. Check hardware and VRAM requirements, choose the right quantization and runtime, compare local vs cloud options, and find the easiest setup for your PC."

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "article",
    url: pageUrl,
    siteName: SITE_NAME,
    title,
    description,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
}

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: [
      "Qwen3.8-27B local setup",
      "Qwen3.8-27B hardware requirements",
      "Qwen3.8-27B VRAM planning",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Qwen 3.8 27B Hardware Requirements",
        item: pageUrl,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
]

export default function Qwen3827BPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="brand-lockup" aria-label="ReDiagram">
            <BrandMark />
            <span className="brand-text">ReDiagram</span>
          </Link>
          <Link href="/editor" className="text-sm font-medium text-foreground hover:text-[var(--brand)]">
            Editor
          </Link>
        </div>
      </header>

      <Hero />
      <QuickAnswer />
      <OfficialSpecs />
      <HardwarePlanner />
      <VramPlanning />
      <HardwareScenarios />
      <AppleSilicon />
      <Quantization />
      <RunLocally />
      <OllamaCard />
      <LMStudioCard />
      <LlamaCppCard />
      <OfficialBenchmark />
      <LocalBenchmarkEmpty />
      <LocalVsCloud />
      <CloudPreview />
      <SetupAssistantVision />
      <StatusTable />
      <Faq />
      <Disclaimer />
    </main>
  )
}
