import Link from "next/link"
import BrandMark from "@/components/brand-mark"

export default function BlogHeader() {
  return (
    <header className="site-header" lang="en">
      <div className="site-container site-header-inner">
        <Link href="/" className="brand-lockup" aria-label="ReDiagram home">
          <BrandMark />
          <span className="brand-text">ReDiagram</span>
        </Link>
        <nav className="flex items-center gap-6" aria-label="Blog navigation">
          <Link href="/blog" className="site-nav-link">Guides</Link>
          <Link href="/editor" className="site-nav-link">Editor</Link>
        </nav>
      </div>
    </header>
  )
}
