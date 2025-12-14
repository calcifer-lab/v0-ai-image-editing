"use client"

import { Zap, Target, Shield } from "lucide-react"

const benefits = [
  {
    icon: Zap,
    title: "Fast and efficient",
    description: "Production-grade performance that accelerates your workflow.",
  },
  {
    icon: Target,
    title: "Accurate and smart",
    description: "AI detects elements and blends them naturally into the scene.",
  },
  {
    icon: Shield,
    title: "Easy to use",
    description: "Runs in the browser with professional-quality results.",
  },
]

export default function Benefits() {
  return (
    <section id="benefits" className="border-b py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Key benefits</h2>
          <p className="text-muted-foreground">Why teams choose AI Image Editor</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

