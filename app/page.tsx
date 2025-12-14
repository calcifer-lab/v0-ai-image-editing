import Header from "@/components/landing/header"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import Benefits from "@/components/landing/benefits"
import FAQ from "@/components/landing/faq"
import Footer from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <FAQ />
      <Footer />
    </div>
  )
}
