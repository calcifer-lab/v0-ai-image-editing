import fs from "fs"
import path from "path"
import matter from "gray-matter"

const BLOG_DIR = path.join(process.cwd(), "content/blog")

export interface BlogPost {
  slug: string
  title: string
  date: string
  description: string
  keywords: string[]
  coverImage: string
  content: string
}

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  description: string
  keywords: string[]
  coverImage: string
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"))
  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "")
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8")
    const { data } = matter(raw)
    return {
      slug,
      title: data.title ?? "",
      date: data.date ?? "",
      description: data.description ?? "",
      keywords: data.keywords ?? [],
      coverImage: data.coverImage ?? "",
    } as BlogPostMeta
  })
  return posts.sort((a, b) => {
    if (a.date < b.date) return 1
    if (a.date > b.date) return -1
    return 0
  })
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(raw)
  return {
    slug,
    title: data.title ?? "",
    date: data.date ?? "",
    description: data.description ?? "",
    keywords: data.keywords ?? [],
    coverImage: data.coverImage ?? "",
    content,
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
