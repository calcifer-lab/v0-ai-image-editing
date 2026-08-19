import { InfoCard, Section } from "./shared"

export function SetupAssistantVision() {
  return (
    <Section title="We Don't Want You to Read Ten Setup Guides" eyebrow="Setup assistant">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Running a local AI model today often means jumping between Google, Hugging Face, Reddit, GitHub, Ollama, LM Studio, cloud GPU providers, and hardware guides.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Tell us what you have">GPU, RAM, operating system, target context length, and runtime preference.</InfoCard>
        <InfoCard title="Get the best configuration">Choose the most appropriate local, cloud, or API path for your hardware and workload.</InfoCard>
        <InfoCard title="Set it up">Follow a focused setup path and start using your private AI without becoming an LLM infrastructure engineer.</InfoCard>
      </div>
    </Section>
  )
}
