import { Badge } from "./shared"
import { TrackedLink } from "./TrackedLink"

export function Hero() {
  return (
    <section className="bg-[#f7f8fa]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Badge>Independent community resource. ReDiagram is not affiliated with Alibaba or the Qwen team.</Badge>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Can Your PC Run Qwen 3.8 27B?</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
          Qwen 3.8 27B Hardware Requirements & Local Setup
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          Qwen 3.8 27B is an official open-weight 27B vision-language model from the Qwen team, designed for coding, professional work, research, multimodal understanding and long-horizon agentic tasks.
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Tell us what hardware you have and find the easiest way to run it locally, or choose a cloud option if your computer is not the right fit.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Official Model", "Qwen/Qwen3.8-27B"],
            ["License", "Apache 2.0"],
            ["Native Context", "262K tokens"],
            ["Extended Context", "Up to 1M tokens"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-background p-4">
              <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <TrackedLink
            href="#hardware-planner"
            event="qwen_check_hardware_clicked"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Estimate Hardware Needs
          </TrackedLink>
          <TrackedLink
            href="https://huggingface.co/Qwen/Qwen3.8-27B"
            event="qwen_official_model_clicked"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
          >
            View Official Model
          </TrackedLink>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["16GB GPU", "#scenario-16gb"],
            ["24GB GPU", "#scenario-24gb"],
            ["32GB GPU", "#scenario-32gb"],
            ["Apple Silicon", "#scenario-apple-silicon"],
          ].map(([label, href]) => (
            <TrackedLink
              key={label}
              href={href}
              event="qwen_hardware_quick_link_clicked"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
            >
              {label}
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  )
}
