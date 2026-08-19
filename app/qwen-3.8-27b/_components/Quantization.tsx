import { Badge, InfoCard, Section } from "./shared"

export function Quantization() {
  return (
    <Section title="Quantization" eyebrow="Local setup">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="What is official">
          <Badge>Confirmed signal</Badge>
          <p className="mt-3">Higher-precision formats generally preserve more model fidelity, while lower-bit formats reduce memory requirements and leave more room for context.</p>
        </InfoCard>
        <InfoCard title="What is not assumed">
          <p>No specific Ollama tag, quant speed, consumer-GPU fit, or Mac performance number is claimed here without independent verification.</p>
        </InfoCard>
      </div>
    </Section>
  )
}
