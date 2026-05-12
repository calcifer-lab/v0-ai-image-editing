import type { Metadata } from "next"
import Script from "next/script"
import { GoogleAnalytics } from "@next/third-parties/google"
import "./globals.css"
import { LangProvider } from "@/contexts/lang-context"
import LangToggleFixed from "@/components/lang-toggle-fixed"

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReDiagram",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  url: "https://www.rediagram.com",
  image: "https://www.rediagram.com/og/placeholder.svg",
  description:
    "ReDiagram helps teams fix diagrams without redrawing them from scratch using upload, selection, and AI-guided repair flows.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
}

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rediagram.com"),
  title: "ReDiagram — Fix any diagram without redrawing it",
  description:
    "ReDiagram helps engineers, designers, authors, and educators fix diagrams without redrawing them. Upload, select, and repair diagrams in minutes.",
  keywords: [
    "ReDiagram",
    "AI diagram editor",
    "fix diagram",
    "diagram repair",
    "diagram editing",
    "wireframe editor",
    "architecture diagram",
    "training materials",
  ],
  alternates: {
    canonical: "https://www.rediagram.com",
  },
  openGraph: {
    type: "website",
    url: "https://www.rediagram.com",
    siteName: "ReDiagram",
    title: "ReDiagram — Fix any diagram without redrawing it",
    description:
      "Fix diagrams without starting over. ReDiagram lets you upload, select, and repair diagrams with AI-first editing.",
    images: [
      {
        url: "https://www.rediagram.com/og/placeholder.svg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReDiagram — Fix any diagram without redrawing it",
    description:
      "A clean AI diagram editor for fixing architecture diagrams, UX wireframes, picture books, and training materials.",
    images: ["https://www.rediagram.com/og/placeholder.svg"],
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationJsonLd),
          }}
        />
        <LangProvider>
          {children}
        </LangProvider>
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
    `,
            }}
          />
        )}
        <GoogleAnalytics gaId="G-1XPECVXKE3" />
      </body>
    </html>
  )
}
