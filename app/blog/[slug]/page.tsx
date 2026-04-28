import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatPostDate, getAllPosts, getPostBySlug } from "../_lib/posts"

const SITE_URL = "https://rediagram.com"

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {}
  }

  const canonicalUrl = `${SITE_URL}/blog/${slug}`
  const ogImage = post.coverImage ? `${SITE_URL}${post.coverImage}` : undefined

  return {
    title: `${post.title} | ReDiagram Fix`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: `${post.title} | ReDiagram Fix`,
      description: post.description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    other: {
      "og:title": `${post.title} | ReDiagram Fix`,
      "og:description": post.description,
      "og:image": ogImage ?? "",
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const canonicalUrl = `${SITE_URL}/blog/${slug}`
  const imageUrl = post.coverImage ? `${SITE_URL}${post.coverImage}` : undefined

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    keywords: post.keywords,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: post.date,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: "ReDiagram Fix",
      url: SITE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-background text-foreground">
        <article className="mx-auto flex w-full max-w-[680px] flex-col px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to Blog
            </Link>
            <Link
              href={SITE_URL}
              className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to Home
            </Link>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">{formatPostDate(post.date)}</p>
          <h1 className="mb-8 text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.04em]">
            {post.title}
          </h1>

          {post.coverImage && (
            <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-[calc(var(--radius)+4px)] bg-muted">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 680px"
              />
            </div>
          )}

          <div className="space-y-6 text-base leading-7 text-[var(--text)]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ ...props }) => <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em]" {...props} />,
                h2: ({ ...props }) => <h2 className="pt-6 text-2xl font-semibold leading-tight tracking-[-0.03em]" {...props} />,
                h3: ({ ...props }) => <h3 className="pt-4 text-xl font-semibold leading-tight" {...props} />,
                p: ({ ...props }) => <p className="text-base leading-7 text-[var(--text)]" {...props} />,
                a: ({ ...props }) => <a className="text-[var(--brand)] underline underline-offset-4" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc space-y-2 pl-6" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal space-y-2 pl-6" {...props} />,
                li: ({ ...props }) => <li className="text-base leading-7 text-[var(--text)]" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-2 border-border pl-4 text-[var(--text-muted)] italic" {...props} />
                ),
                code: ({ className, children, ...props }) => {
                  const isBlock = Boolean(className)
                  return isBlock ? (
                    <code className={`block overflow-x-auto rounded-2xl bg-[var(--bg-card)] p-4 text-sm ${className ?? ""}`} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-sm" {...props}>
                      {children}
                    </code>
                  )
                },
                table: ({ ...props }) => (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm" {...props} />
                  </div>
                ),
                th: ({ ...props }) => <th className="border-b border-border px-3 py-2 font-medium" {...props} />,
                td: ({ ...props }) => <td className="border-b border-border px-3 py-2 align-top" {...props} />,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          <div className="mt-12 rounded-[calc(var(--radius)+2px)] border border-border bg-[var(--bg-card)] p-6 sm:p-8">
            <a
              href={SITE_URL}
              className="inline-flex text-lg font-semibold tracking-[-0.02em] text-[var(--brand)] transition-colors hover:text-[var(--accent-dark)]"
            >
              Try ReDiagram Fix free →
            </a>
            <p className="mt-2 max-w-[40ch] text-sm leading-6 text-muted-foreground">
              Repair specific parts of an AI-generated image without throwing away the composition you already like.
            </p>
          </div>
        </article>
      </main>
    </>
  )
}
