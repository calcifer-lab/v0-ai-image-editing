import { Badge, Section } from "./shared"

const benchmarks = [
  ["Terminal Bench 2.1", "73.0"],
  ["SWE-bench Pro", "61.7"],
  ["LiveCodeBench v6", "90.3"],
  ["OSWorld-Verified", "84.3"],
]

export function OfficialBenchmark() {
  return (
    <Section title="Qwen 3.8 27B Benchmark Results" eyebrow="Official benchmark">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        <Badge tone="official">Official capability</Badge>
        <span className="ml-3">These measure model capability, not local GPU speed.</span>
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground"><tr><th className="px-4 py-3">Benchmark</th><th className="px-4 py-3">Qwen 3.8 27B</th></tr></thead>
          <tbody>{benchmarks.map(([name, score]) => <tr key={name} className="border-t border-border"><td className="px-4 py-3 font-medium text-foreground">{name}</td><td className="px-4 py-3 text-muted-foreground">{score}</td></tr>)}</tbody>
        </table>
      </div>
      <a
        href="https://huggingface.co/Qwen/Qwen3.8-27B"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex text-sm font-medium text-[var(--brand)] underline underline-offset-4"
      >
        View full official benchmark →
      </a>
    </Section>
  )
}
