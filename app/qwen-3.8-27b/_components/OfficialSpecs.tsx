import { Badge, Section } from "./shared"

const specs = [
  ["Parameters", "27B"],
  ["Model Type", "Causal Language Model with Vision Encoder"],
  ["Layers", "64"],
  ["Hidden Dimension", "5,120"],
  ["Native Context", "262,144 tokens"],
  ["Extended Context", "Up to 1,000,000 tokens"],
  ["Vision", "Image + Video"],
  ["Thinking Mode", "Enabled by default"],
  ["License", "Apache 2.0"],
]

const runtimes = ["Hugging Face Transformers", "vLLM", "SGLang", "TokenSpeed", "Docker Model Runner"]

export function OfficialSpecs() {
  return (
    <Section id="about" title="Quick Specs" eyebrow="Official specifications">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <tbody>
            {specs.map(([label, value]) => (
              <tr key={label} className="border-b border-border last:border-0">
                <th className="w-44 bg-muted px-4 py-3 font-medium text-foreground">{label}</th>
                <td className="px-4 py-3 text-muted-foreground">
                  <Badge tone="official">Official</Badge>
                  <span className="ml-3 align-middle">{value}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        <Badge tone="official">Official runtime ecosystem</Badge>
        <span className="ml-3">The official model page provides or references support for {runtimes.join(", ")}.</span>
        <p className="mt-3">Quantized versions can also be used with compatible local runtimes such as llama.cpp, Ollama, and LM Studio. Exact quant availability and local runtime compatibility may vary by build.</p>
      </div>
    </Section>
  )
}
