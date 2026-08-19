export const SITE_URL = "https://www.rediagram.com"
export const SITE_NAME = "ReDiagram"
export const PRODUCT_NAME = "ReDiagram Fix"
export const DEFAULT_OG_IMAGE = "/og/placeholder.svg"

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export const defaultKeywords = [
  "ReDiagram",
  "ReDiagram Fix",
  "AI image editor",
  "AI image compositing",
  "fix AI image",
  "replace object in AI image",
  "AI image object swap",
  "AI image inpainting alternative",
  "reference image editing",
]
