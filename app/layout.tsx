import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LangProvider } from "@/contexts/lang-context"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReDiagram AI",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  url: "https://rediagram.com",
  image: "https://rediagram.com/og/placeholder.svg",
  description:
    "ReDiagram AI helps teams fix diagrams without redrawing them from scratch using upload, selection, and AI-guided repair flows.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
}

export const metadata: Metadata = {
  metadataBase: new URL("https://rediagram.com"),
  title: "ReDiagram AI — Fix any diagram without redrawing it",
  description:
    "ReDiagram AI helps engineers, designers, authors, and educators fix diagrams without redrawing them. Upload, select, and repair diagrams in minutes.",
  keywords: [
    "ReDiagram AI",
    "AI diagram editor",
    "fix diagram",
    "diagram repair",
    "diagram editing",
    "wireframe editor",
    "architecture diagram",
    "training materials",
  ],
  alternates: {
    canonical: "https://rediagram.com",
  },
  openGraph: {
    type: "website",
    url: "https://rediagram.com",
    siteName: "ReDiagram AI",
    title: "ReDiagram AI — Fix any diagram without redrawing it",
    description:
      "Fix diagrams without starting over. ReDiagram AI lets you upload, select, and repair diagrams with AI-first editing.",
    images: [
      {
        url: "https://rediagram.com/og/placeholder.svg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReDiagram AI — Fix any diagram without redrawing it",
    description:
      "A clean AI diagram editor for fixing architecture diagrams, UX wireframes, picture books, and training materials.",
    images: ["https://rediagram.com/og/placeholder.svg"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationJsonLd),
          }}
        />
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
