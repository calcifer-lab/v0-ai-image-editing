import ToolOverview from "@/components/landing/tool-overview"
import Header from "@/components/landing/header"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import FAQ from "@/components/landing/faq"
import Footer from "@/components/landing/footer"

export default function Home() {
  const showTools = process.env.NODE_ENV === "development"
  return (
    <main className="landing-shell">
      <Header showTools={showTools} />
      <Hero showTools={showTools} />
      {showTools && <ToolOverview />}
      <Features />
      <HowItWorks />
      <FAQ showTools={showTools} />
      <Footer showTools={showTools} />
    </main>
  )
}
