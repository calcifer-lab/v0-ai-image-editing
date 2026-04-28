import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { formatPostDate, getAllPosts } from "./_lib/posts"

export const metadata: Metadata = {
  title: "Blog | ReDiagram Fix",
  description: "Tips, tutorials, and news from the ReDiagram Fix team.",
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="brand-lockup" aria-label="ReDiagram">
            <span className="brand-mark">R</span>
            <span className="brand-text">ReDiagram</span>
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            Blog
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col px-4 py-16 sm:px-6 sm:py-20">
        <div className="section-head">
          <span className="eyebrow">Insights</span>
          <h1 className="section-title">Blog</h1>
          <p className="section-copy">
            Tutorials, product notes, and practical workflows for fixing AI-generated visuals without starting over.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-border bg-card px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(17,17,17,0.08)]"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-[#15357c] via-[#2b5ce6] to-[#6540d8]" />
                  )}
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  <p className="text-sm text-muted-foreground">{formatPostDate(post.date)}</p>
                  <h2 className="text-xl font-semibold leading-tight tracking-[-0.03em] transition-colors group-hover:text-[var(--brand)]">
                    {post.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">{post.description}</p>
                  <span className="inline-flex text-sm font-medium text-[var(--brand)]">
                    Read post →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
