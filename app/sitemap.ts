import type { MetadataRoute } from "next"
import { getAllPosts } from "./blog/_lib/posts"

const BASE_URL = "https://www.rediagram.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()
  const blogPosts = getAllPosts(false)

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/deepseek-v4-1-flash-1017` },
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
      url: `${BASE_URL}/qwen-3.8-27b`,
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
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...blogRoutes]
}
