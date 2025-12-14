"use client"

import { Wand2, Layers, Crop, Zap, Shield, Sparkles } from "lucide-react"

const features = [
  {
    icon: Layers,
    title: "Direct paste",
    description: "Copy elements precisely and remove backgrounds automatically.",
  },
  {
    icon: Wand2,
    title: "AI generation",
    description: "Blend intelligently and match the target style automatically.",
  },
  {
    icon: Crop,
    title: "Flexible selection",
    description: "Bounding box, brush, and eraser tools to mark regions.",
  },
  {
    icon: Zap,
    title: "Fast processing",
    description: "Direct edits in about 5 seconds, AI in about 30 seconds.",
  },
  {
    icon: Shield,
    title: "Privacy first",
    description: "Images are not stored after the session ends.",
  },
  {
    icon: Sparkles,
    title: "Rich outputs",
    description: "Custom aspect ratios and dimensions for export.",
  },
]

export default function Features() {
  return (
    <section id="features" className="border-b py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Core features</h2>
          <p className="text-muted-foreground">Powerful capabilities with a straightforward workflow</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

