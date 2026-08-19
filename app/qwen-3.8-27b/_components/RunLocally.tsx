import { Badge, InfoCard, Section } from "./shared"

const runtimeCards = [
  {
    title: "LM Studio",
    label: "Easiest GUI",
    copy: "Best starting point if you want a desktop app and compatible quantized files without managing a server stack.",
  },
  {
    title: "Ollama",
    label: "Simple CLI",
    copy: "Useful for command-line workflows when a compatible build is available. This page does not claim an official tag or pull command.",
  },
  {
    title: "llama.cpp",
    label: "More Control",
    copy: "Good for users who want direct control over local inference settings, quantized files, and hardware-specific tuning.",
  },
  {
    title: "vLLM / SGLang",
    label: "Serving",
    copy: "Better fit for production-style serving, concurrency, and higher-throughput deployments than a single-user desktop app.",
  },
]

export function RunLocally() {
  return (
    <Section id="setup" title="Best Ways to Run Qwen 3.8 27B Locally" eyebrow="Compatible runtimes">
      <div className="grid gap-4 md:grid-cols-2">
        {runtimeCards.map((runtime) => (
          <InfoCard key={runtime.title} title={runtime.title}>
            <Badge tone="neutral">Compatibility</Badge>
            <span className="ml-3 font-medium text-foreground">{runtime.label}</span>
            <p className="mt-3">{runtime.copy}</p>
          </InfoCard>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        <Badge tone="official">Official</Badge>
        <span className="ml-3">Secondary developer paths: Hugging Face Transformers and Docker Model Runner.</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Tell us what hardware you have, get the best setup path, and avoid jumping between multiple setup guides.
      </p>
    </Section>
  )
}
