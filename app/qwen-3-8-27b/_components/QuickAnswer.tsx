import { Badge, InfoCard, Section } from "./shared"

export function QuickAnswer() {
  return (
    <Section title="What Is Qwen 3.8 27B?" eyebrow="Quick answer">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Official open-weight model">
          <Badge>Confirmed</Badge>
          <p className="mt-3">Qwen 3.8 27B is a dense 27-billion-parameter causal language model with a vision encoder.</p>
          <p className="mt-3">Unlike a text-only LLM, it can natively understand images and videos in addition to text.</p>
        </InfoCard>
        <InfoCard title="Positioning">
          <p>Qwen positions the model for coding, professional work, research, long-horizon agent tasks, autonomous planning, and multimodal understanding.</p>
          <p className="mt-3">The model uses thinking mode by default and supports configurable reasoning depth.</p>
        </InfoCard>
      </div>
    </Section>
  )
}
