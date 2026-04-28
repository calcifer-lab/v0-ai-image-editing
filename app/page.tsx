import Header from "@/components/landing/header"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import FAQ from "@/components/landing/faq"
import About from "@/components/landing/about"
import Footer from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="landing-shell">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <About />
      <Footer />
    </main>
  )
}
