"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"

const faqs = [
  {
    q: "Which image formats are supported?",
    a: "PNG, JPG, and JPEG are supported. Files under 10MB are recommended for best performance.",
  },
  {
    q: "What is the difference between Direct and AI modes?",
    a: "Direct mode copies elements exactly, while AI mode blends intelligently and matches the target style.",
  },
  {
    q: "How long does processing take?",
    a: "Direct mode typically takes 5–10 seconds; AI mode usually takes 20–60 seconds.",
  },
  {
    q: "Are my images stored?",
    a: "Images are used only during the current session and are not saved after processing.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="border-b bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
          <p className="text-muted-foreground">Quick answers about how the product works</p>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <Card key={index} className="overflow-hidden border-2">
                <button
                  className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <div className="flex gap-4">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="font-semibold">{faq.q}</span>
                  </div>
                  <Plus
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                <div className={`overflow-hidden transition-all ${isOpen ? "max-h-32" : "max-h-0"}`}>
                  <div className="border-t px-6 pb-6 pt-4">
                    <p className="ml-10 text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

