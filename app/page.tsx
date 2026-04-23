import ClientLayout from "@/components/lang-provider"
import Header from "@/components/landing/header"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import HowItWorks from "@/components/landing/how-it-works"
import Benefits from "@/components/landing/benefits"
import FAQ from "@/components/landing/faq"
import Footer from "@/components/landing/footer"

export default function Home() {
  return (
    <ClientLayout>
      <div className="min-h-screen" style={{ background: 'var(--ba-bg, #fbfbfd)' }}>
        <Header />
        <Hero />
        <Features />
        <HowItWorks />
        <Benefits />
        <FAQ />
        <div className="ba-cta-section">
          <div className="ba-cta-box">
            <h2>
              <span className="lang-en">Ready to <em>blend</em>?</span>
              <span className="lang-zh">准备好 <em>融合</em>了吗？</span>
            </h2>
            <p>
              <span className="lang-en">Start with a demo image, or upload your own photos.</span>
              <span className="lang-zh">使用示例图开始，或上传你自己的照片。</span>
            </p>
            <a href="/editor?demo=true" className="ba-btn-primary-invert">
              <span className="lang-en">Try with demo image →</span>
              <span className="lang-zh">用示例图体验 →</span>
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </ClientLayout>
  )
}
