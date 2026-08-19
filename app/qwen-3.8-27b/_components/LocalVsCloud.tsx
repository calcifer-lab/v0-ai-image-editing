import { Badge, InfoCard, Section } from "./shared"

export function LocalVsCloud() {
  return (
    <Section title="What's the Best Way to Run Qwen 3.8 27B?" eyebrow="Local vs cloud vs API">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Local deployment is not automatically the best option. The right answer depends on hardware you already own, usage frequency, privacy, setup complexity, performance, and cost.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Local">Best when you already own suitable hardware, use AI frequently, need privacy, or want full control.</InfoCard>
        <InfoCard title="Cloud GPU">Best when your computer is not powerful enough, you want to test before buying hardware, or you need high performance occasionally.</InfoCard>
        <InfoCard title="Hosted API">Best when you want the easiest setup, use the model lightly, or do not want to maintain infrastructure.</InfoCard>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        The official Qwen page recommends API use for streamlined integration and dedicated serving engines for production or high-throughput workloads.
      </p>
      <div className="mt-4 rounded-lg border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
        <Badge tone="estimated">Estimated</Badge>
        <span className="ml-3">Verified consumer hardware benchmarks are being collected.</span>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        <p className="font-medium text-foreground">Local Hardware Not Enough?</p>
        <p className="mt-2">Cloud GPU recommendations will be added after verified hardware profiles are collected.</p>
      </div>
    </Section>
  )
}
