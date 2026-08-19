import { Section } from "./shared"

export function Disclaimer() {
  return (
    <Section title="Independent Qwen 3.8 27B Resource" eyebrow="Disclaimer">
      <div className="rounded-lg border border-border bg-muted p-5 text-sm leading-6 text-muted-foreground">
        <p>This page is an independent technical resource.</p>
        <p className="mt-3">ReDiagram is not affiliated with Alibaba, Qwen, Hugging Face, Ollama, LM Studio, SGLang, vLLM or other third-party projects mentioned here.</p>
        <p className="mt-3">Third-party names are used only for identification, compatibility and educational purposes. Hardware sizing estimates are not official Qwen specifications. Measured hardware benchmarks will be clearly separated from estimates.</p>
        <p className="mt-3">Last verified: August 19, 2026</p>
      </div>
    </Section>
  )
}
