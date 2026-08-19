import { InfoCard, Section } from "./shared"

export function HardwareScenarios() {
  return (
    <Section title="Hardware Scenarios" eyebrow="Local planning">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="16GB VRAM" id="scenario-16gb">
          <p><strong>Likely fit:</strong> compact quantized local inference.</p>
          <p className="mt-2"><strong>Trade-off:</strong> limited context and less room for multimodal workloads.</p>
          <p className="mt-2"><strong>Watch:</strong> KV cache growth, offload behavior, and runtime support.</p>
        </InfoCard>
        <InfoCard title="24GB VRAM" id="scenario-24gb">
          <p><strong>Likely fit:</strong> strong consumer GPU tier for quantized inference.</p>
          <p className="mt-2"><strong>Trade-off:</strong> larger context still competes with model memory.</p>
          <p className="mt-2"><strong>Watch:</strong> selected build, context length, and vision usage.</p>
        </InfoCard>
        <InfoCard title="32GB VRAM" id="scenario-32gb">
          <p><strong>Likely fit:</strong> more comfortable local planning headroom.</p>
          <p className="mt-2"><strong>Trade-off:</strong> not a guarantee for every quantization or long-context target.</p>
          <p className="mt-2"><strong>Watch:</strong> memory reserved by runtime, driver, and concurrent apps.</p>
        </InfoCard>
        <InfoCard title="Apple Silicon" id="scenario-apple-silicon">
          <p><strong>Likely fit:</strong> depends on unified memory capacity and bandwidth.</p>
          <p className="mt-2"><strong>Trade-off:</strong> CPU/GPU sharing makes simple VRAM comparisons weak.</p>
          <p className="mt-2"><strong>Watch:</strong> chip generation, thermals, runtime support, and context size.</p>
        </InfoCard>
      </div>
    </Section>
  )
}
