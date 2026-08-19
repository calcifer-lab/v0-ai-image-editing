import { Badge, Section } from "./shared"

const rows = [
  ["BF16 / FP16", "27B x 2 bytes", "≈ 54 GB"],
  ["8-bit class", "27B x 1 byte", "≈ 27 GB"],
  ["6-bit class", "27B x 0.75 bytes", "≈ 20 GB"],
  ["4-bit class", "27B x 0.5 bytes", "≈ 13.5 GB theoretical minimum"],
]

export function VramPlanning() {
  return (
    <Section id="hardware-guide" title="VRAM Requirements" eyebrow="Estimated planning">
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <Badge tone="estimated">Estimated</Badge>
        <span className="ml-3">These are rough weights-only estimates, not official Qwen hardware requirements.</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr>
              <th className="px-4 py-3">Precision</th>
              <th className="px-4 py-3">Simple math</th>
              <th className="px-4 py-3">Rough weights-only size</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([precision, math, memory]) => (
              <tr key={precision} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{precision}</td>
                <td className="px-4 py-3 text-muted-foreground">{math}</td>
                <td className="px-4 py-3 text-muted-foreground">{memory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
