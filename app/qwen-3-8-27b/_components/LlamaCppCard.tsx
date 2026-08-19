import { Badge, InfoCard, Section } from "./shared"

export function LlamaCppCard() {
  return (
    <Section title="llama.cpp" eyebrow="Compatible path">
      <InfoCard title="Compatible quantization path available">
        <Badge>Compatibility</Badge>
        <p className="mt-3">The Qwen 3.8 27B Hugging Face page links users to quantizations intended for llama.cpp-compatible usage. Treat local speeds as hardware-specific until tested.</p>
      </InfoCard>
    </Section>
  )
}
