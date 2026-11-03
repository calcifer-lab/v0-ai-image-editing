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
          {process.env.NODE_ENV === "development" && <Link href="/lab/tools" className="site-nav-link">Tools</Link>}
          <Link href="/blog" className="site-nav-link">Guides</Link>
          <Link href="/editor" className="site-nav-link">Try Fix</Link>
        </nav>
      </div>
    </header>
  )
}
