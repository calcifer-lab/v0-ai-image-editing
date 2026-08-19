import { InfoCard, Section } from "./shared"

export function HardwareScenarios() {
  return (
    <Section title="Hardware Scenarios" eyebrow="Local planning">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Consumer GPU">16 GB to 24 GB cards may require aggressive quantization, shorter context, or CPU/RAM offload depending on runtime support.</InfoCard>
        <InfoCard title="Workstation GPU">32 GB to 48 GB+ VRAM gives more room for quantized weights, KV cache, and multimodal workloads, but performance still depends on runtime.</InfoCard>
        <InfoCard title="CPU only">CPU-only use is possible to test compatibility in some runtimes, but expect slow generation and high system memory pressure.</InfoCard>
      </div>
    </Section>
  )
}
