"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function Hero() {
  return (
    <section className="border-b py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-powered image editing
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Intelligent image compositing
            <br />
            <span className="text-primary">Simple and high-quality</span>
          </h1>
          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            Select objects and regions, then let AI handle background removal and smart blending automatically.
          </p>
          <Link href="/editor">
            <Button size="lg" className="h-12 px-8 text-base">
              Start for free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

