import type { MetadataRoute } from "next"
import fs from "fs"
import path from "path"

const BASE_URL = "https://www.rediagram.com"
const BLOG_DIR = path.join(process.cwd(), "content", "blog")

type BlogPost = { slug: string; lastmod: string }

function readFrontmatterDate(filePath: string): string | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const fm = raw.match(/^---([\s\S]*?)---/)
    if (!fm) return null
    const dateMatch = fm[1].match(/^\s*date\s*:\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})"?/m)
    if (!dateMatch) return null
    const d = new Date(dateMatch[1])
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

function getBlogSlugs(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(BLOG_DIR, file)
      const fmDate = readFrontmatterDate(filePath)
      const stat = fs.statSync(filePath)
      const slugFromFile = file.replace(/\.md$/, "")
      return {
        slug: slugFromFile,
        lastmod: fmDate ?? stat.mtime.toISOString(),
      }
    })
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()
  const blogPosts = getBlogSlugs()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/editor`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/qwen-3-8-27b`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.lastmod,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...blogRoutes]
}
