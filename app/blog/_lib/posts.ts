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
    content,
  }
}

export function getAllPosts(): BlogPostFrontmatter[] {
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return []
  }

  return fs
    .readdirSync(BLOG_DIRECTORY)
    .filter((filename) => filename.endsWith(".md"))
    .map(readMarkdownFile)
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(({ content: _content, ...post }) => post)
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIRECTORY, `${slug}.md`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  return readMarkdownFile(`${slug}.md`)
}

export function formatPostDate(date: string): string {
  return format(parseISO(date), "MMMM d, yyyy")
}
