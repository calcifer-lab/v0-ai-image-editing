import { Badge, InfoCard, Section } from "./shared"

export function OllamaCard() {
  return (
    <Section title="Ollama" eyebrow="Compatible path">
      <InfoCard title="Compatible quantization path available">
        <Badge>Compatibility</Badge>
        <p className="mt-3">The official model page links to a quantization browser for Ollama-compatible formats. This page does not claim an official Ollama tag or provide an unverified pull command.</p>
      </InfoCard>
    </Section>
  )
}
