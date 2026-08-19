import { Badge, InfoCard, Section } from "./shared"

export function AppleSilicon() {
  return (
    <Section title="Apple Silicon" eyebrow="Estimated planning">
      <InfoCard title="Unified memory changes the question">
        <Badge tone="estimated">Estimated</Badge>
        <p className="mt-3">
          Mac viability depends on unified memory size, quantization format, runtime support, context length, and thermal limits. Treat 64 GB or higher unified memory as a more realistic exploration tier than 16 GB or 32 GB, without assuming guaranteed speed.
        </p>
      </InfoCard>
    </Section>
  )
}
