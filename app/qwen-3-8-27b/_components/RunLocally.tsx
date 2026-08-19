import { Badge, InfoCard, Section } from "./shared"

export function RunLocally() {
  return (
    <Section title="Run Locally" eyebrow="Compatible runtimes">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Hugging Face Transformers"><Badge tone="official">Official</Badge><p className="mt-3">The official model is available as Qwen/Qwen3.8-27B for developers who want direct model integration in Python.</p></InfoCard>
        <InfoCard title="vLLM"><Badge tone="official">Official</Badge><p className="mt-3">The official Qwen model page provides a vLLM serving path for serving and higher-throughput deployments.</p></InfoCard>
        <InfoCard title="SGLang"><Badge tone="official">Official</Badge><p className="mt-3">Qwen also officially documents SGLang deployment for production-oriented or high-throughput serving.</p></InfoCard>
        <InfoCard title="Docker Model Runner"><Badge tone="official">Official</Badge><p className="mt-3">The official Hugging Face page exposes a Docker Model Runner path for the Qwen/Qwen3.8-27B model.</p></InfoCard>
      </div>
    </Section>
  )
}
