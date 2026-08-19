import { InfoCard, Section } from "./shared"

const tiers = ["Cheapest", "Best Value", "Best Performance"]

export function CloudPreview() {
  return (
    <Section title="Your Computer Isn't Enough? Don't Buy a GPU Yet." eyebrow="Cloud GPU recommendation">
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        If your local hardware is not suitable, renting a GPU may be cheaper and easier than upgrading your computer.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <InfoCard key={tier} title={tier}>
            {tier === "Cheapest" ? "Lowest-cost workable configuration." : null}
            {tier === "Best Value" ? "Best balance of price, memory, speed, and ease of deployment." : null}
            {tier === "Best Performance" ? "Best option for larger context, agent workloads, multimodal tasks, and higher throughput." : null}
          </InfoCard>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Each result will eventually include GPU, VRAM, provider, price per hour, compatibility, direct rental link, and last price check.
      </p>
    </Section>
  )
}
