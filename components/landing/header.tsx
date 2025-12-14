"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"

export default function Header() {
  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "Workflow" },
    { href: "#benefits", label: "Benefits" },
    { href: "#faq", label: "FAQ" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <ImageIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>AI Image Editor</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link href="/editor">
          <Button size="sm">Get started</Button>
        </Link>
      </div>
    </header>
  )
}

