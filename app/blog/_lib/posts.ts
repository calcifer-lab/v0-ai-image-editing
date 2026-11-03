import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { format, parseISO } from "date-fns"

const BLOG_DIRECTORY = path.join(process.cwd(), "content/blog")

export interface BlogPostFrontmatter {
  title: string
  date: string
  slug: string
  description: string
  keywords: string[]
  coverImage: string
  draft: boolean
  toolHref: string
  toolLabel: string
}

export interface BlogPost extends BlogPostFrontmatter {
  content: string
}

function readMarkdownFile(filename: string): BlogPost {
  const filePath = path.join(BLOG_DIRECTORY, filename)
  const fileContents = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(fileContents)
  const slugFromFilename = filename.replace(/\.md$/, "")

  return {
    title: typeof data.title === "string" ? data.title : "",
    date: typeof data.date === "string" ? data.date : "",
    slug: typeof data.slug === "string" ? data.slug : slugFromFilename,
    description: typeof data.description === "string" ? data.description : "",
    keywords: Array.isArray(data.keywords) ? data.keywords.filter((item): item is string => typeof item === "string") : [],
    coverImage: typeof data.coverImage === "string" ? data.coverImage : "",
    draft: data.draft === true,
    toolHref: typeof data.toolHref === "string" && /^\/(?!\/)/.test(data.toolHref) ? data.toolHref : "/editor",
    toolLabel: typeof data.toolLabel === "string" ? data.toolLabel : "Open Reference Patch",
    content,
  }
}

export function getAllPosts(includeDrafts = process.env.NODE_ENV === "development"): BlogPostFrontmatter[] {
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return []
  }

  return fs
    .readdirSync(BLOG_DIRECTORY)
    .filter((filename) => filename.endsWith(".md"))
    .map(readMarkdownFile)
    .filter((post) => includeDrafts || !post.draft)
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(({ content: _content, ...post }) => post)
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  const filePath = path.join(BLOG_DIRECTORY, `${slug}.md`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const post = readMarkdownFile(`${slug}.md`)
  return post.draft && process.env.NODE_ENV !== "development" ? null : post
}

export function formatPostDate(date: string): string {
  return format(parseISO(date), "MMMM d, yyyy")
}
