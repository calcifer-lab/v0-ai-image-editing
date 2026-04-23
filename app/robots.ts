import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://rediagram.com/sitemap.xml",
    host: "https://rediagram.com",
  }
}
