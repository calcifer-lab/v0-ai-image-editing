import { Section } from "./shared"

type LocalBenchmark = {
  gpu: string
  vramGb?: number
  ramGb?: number
  quant: string
  runtime: string
  context: number
  tokensPerSecond?: number
  sourceUrl: string
  sourceType: "community" | "official"
}

const localBenchmarks: LocalBenchmark[] = []

export function LocalBenchmarkEmpty() {
  return (
    <Section title="Qwen 3.8 27B Local Hardware Benchmark" eyebrow="Community data">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Verified community hardware results are being collected.</p>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr>{["GPU", "VRAM", "RAM", "Quant", "Runtime", "Context", "Tok/s", "Source"].map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody>
            {localBenchmarks.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No verified local benchmark rows yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
