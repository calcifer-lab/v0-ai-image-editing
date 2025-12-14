"use client"

import { Upload, Crop, Sparkles } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload images",
    description: "Add your source elements and target image.",
  },
  {
    icon: Crop,
    title: "Select regions",
    description: "Mark objects and the area where they should go.",
  },
  {
    icon: Sparkles,
    title: "Generate results",
    description: "Pick a mode and create the final composite with one click.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold">How it works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

