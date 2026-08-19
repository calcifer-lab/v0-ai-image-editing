import { Badge, Section } from "./shared"

const rows = [
  ["Official model weights", "Confirmed", "Official model page"],
  ["Official Hugging Face repository", "Confirmed", "Official model page"],
  ["License", "Apache 2.0", "Official model page"],
  ["Parameters", "27B", "Official model page"],
  ["Native context", "262K", "Official model page"],
  ["Extended context", "Up to 1M", "Official model page"],
  ["Vision / video understanding", "Confirmed", "Official model page"],
  ["Transformers", "Confirmed", "Official model page"],
  ["vLLM", "Confirmed", "Official model page"],
  ["SGLang", "Confirmed", "Official model page"],
  ["Docker Model Runner", "Confirmed", "Official model page"],
  ["Quantization ecosystem", "Available", "Official model page"],
  ["llama.cpp compatibility", "Quantization path available", "Official model page"],
  ["Ollama compatibility", "Quantization path available", "Official model page"],
  ["LM Studio compatibility", "Quantization path available", "Official model page"],
]

export function StatusTable() {
  return (
    <Section title="Qwen 3.8 27B Status" eyebrow="Status">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([item, status, source]) => (
              <tr key={item} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{item}</td>
                <td className="px-4 py-3 text-muted-foreground">{status}</td>
                <td className="px-4 py-3"><Badge>{source}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Last verified: August 19, 2026</p>
    </Section>
  )
}
