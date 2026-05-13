import type { Metadata } from "next"
import About from "@/components/landing/about"
import Footer from "@/components/landing/footer"
import Header from "@/components/landing/header"

export const metadata: Metadata = {
  title: "About ReDiagram",
  description:
    "ReDiagram Fix isn't another AI image editor. Pull the right element from a reference image, compose it seamlessly, leave everything else untouched.",
  alternates: {
    canonical: "https://www.rediagram.com/about",
  },
}

export default function AboutPage() {
  return (
    <main className="landing-shell">
      <Header />
      <About />
      <Footer />
    </main>
  )
}
