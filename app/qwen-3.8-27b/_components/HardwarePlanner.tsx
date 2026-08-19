"use client"

import { useEffect, useState } from "react"
import { track } from "@/lib/analytics"

const gpuOptions = ["8 GB", "12 GB", "16 GB", "24 GB", "32 GB", "48 GB+", "Apple Silicon", "CPU Only"]
const ramOptions = ["16 GB", "32 GB", "64 GB", "96 GB", "128 GB+"]
const usageOptions = ["Chat", "Coding", "Agent", "Long Context", "Multimodal", "Testing"]

function guidanceForGpu(gpu: string) {
  if (gpu === "8 GB" || gpu === "12 GB" || gpu === "CPU Only") {
    return "Likely difficult for a 27B-class model without heavy offloading or aggressive quantization."
  }
  if (gpu === "16 GB") return "Potential with compact quantization and limited context."
  if (gpu === "24 GB") return "A strong consumer-GPU planning tier for quantized local inference."
  if (gpu === "Apple Silicon") return "Viability depends heavily on unified memory capacity and memory bandwidth."
  return "More comfortable headroom for higher-quality quantization and larger context."
}

export function HardwarePlanner() {
  const [gpu, setGpu] = useState(gpuOptions[0])
  const [ram, setRam] = useState(ramOptions[1])
  const [usage, setUsage] = useState(usageOptions[0])
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    track("qwen_page_view")
  }, [])

  function markStarted(nextProps: Record<string, string>) {
    if (!started) {
      track("qwen_hardware_planner_started", nextProps)
      setStarted(true)
    }
  }

  return (
    <section id="hardware-planner" className="border-t border-border bg-[#f7f8fa] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-6 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Hardware checker</p>
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">Check Your Qwen 3.8 27B Setup</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This V0 planner records your target tier and points you back to the guide. It does not output unverified quantization recommendations.
          </p>
        </div>
        <form
          className="rounded-lg border border-border bg-card p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault()
            track("qwen_hardware_planner_completed", { gpu, ram, usage })
            setSubmitted(true)
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-foreground">
              GPU / Memory
              <select
                value={gpu}
                onChange={(event) => {
                  setGpu(event.target.value)
                  markStarted({ field: "gpu", value: event.target.value })
                }}
                className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {gpuOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              RAM
              <select
                value={ram}
                onChange={(event) => {
                  setRam(event.target.value)
                  markStarted({ field: "ram", value: event.target.value })
                }}
                className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ramOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Usage
              <select
                value={usage}
                onChange={(event) => {
                  setUsage(event.target.value)
                  markStarted({ field: "usage", value: event.target.value })
                }}
                className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {usageOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Estimate Hardware Needs
          </button>
          {submitted ? (
            <div className="mt-5 rounded-lg border border-border bg-muted p-4 text-sm leading-6 text-foreground">
              <p>{guidanceForGpu(gpu)}</p>
              <p className="mt-2 text-muted-foreground">Estimated planning guidance — not a verified hardware benchmark.</p>
              <a href="#hardware" className="mt-2 inline-flex font-medium text-[var(--brand)] underline underline-offset-4">Back to VRAM Planning</a>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  )
}
