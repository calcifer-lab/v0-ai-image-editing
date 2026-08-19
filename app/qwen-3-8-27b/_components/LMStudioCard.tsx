import { Badge, InfoCard, Section } from "./shared"

export function LMStudioCard() {
  return (
    <Section title="LM Studio" eyebrow="Compatible path">
      <InfoCard title="Compatible quantization path available">
        <Badge>Compatibility</Badge>
        <p className="mt-3">Use the official quantization browser to find LM Studio compatible files. Exact fit and speed depend on the selected quant, hardware, and context length.</p>
      </InfoCard>
    </Section>
  )
}
