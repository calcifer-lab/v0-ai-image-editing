import { Section } from "./shared"

export const faqItems = [
  {
    question: "Is Qwen 3.8 27B available now?",
    answer: "Yes. The official Qwen Hugging Face repository contains the model weights and configuration files.",
  },
  {
    question: "Is Qwen 3.8 27B open weight?",
    answer: "Yes. The official repository publishes the model weights under the Apache 2.0 license.",
  },
  {
    question: "How many parameters does Qwen 3.8 27B have?",
    answer: "The official model card lists 27 billion language-model parameters.",
  },
  {
    question: "What is the Qwen 3.8 27B context length?",
    answer: "The official model card lists a native context length of 262,144 tokens and says the model can be extended up to 1,000,000 tokens.",
  },
  {
    question: "Is Qwen 3.8 27B multimodal?",
    answer: "Yes. It is a causal language model with a vision encoder and supports native image and video understanding.",
  },
  {
    question: "How much VRAM does Qwen 3.8 27B need?",
    answer: "There is no single answer. VRAM requirements depend on precision, quantization, context length, runtime, KV cache, and offloading. Use the hardware planner for tier-level guidance, not a verified benchmark.",
  },
  {
    question: "Can Qwen 3.8 27B run on 16 GB VRAM?",
    answer: "A compact quantized version may make this possible, but the usable context and performance depend on the exact quant and runtime. Use verified real-world benchmarks rather than assuming theoretical model size equals actual VRAM usage.",
  },
  {
    question: "Can Qwen 3.8 27B run on an RTX 4090?",
    answer: "24 GB of VRAM gives considerably more flexibility for a quantized 27B model. The exact recommended quant, context and measured speed should be based on verified Qwen 3.8 27B hardware benchmarks.",
  },
  {
    question: "Can Qwen 3.8 27B run on a Mac?",
    answer: "Yes, compatible quantized local models may run on Apple Silicon using unified memory. Performance and supported context depend on chip generation, memory capacity, memory bandwidth, quantization and runtime.",
  },
  {
    question: "Can I use Qwen 3.8 27B with Ollama?",
    answer: "The official Hugging Face page provides access to quantized builds intended for compatible apps including Ollama. The exact model tag and recommended quant should still be verified before displaying a one-click command.",
  },
  {
    question: "Can I use Qwen 3.8 27B with LM Studio?",
    answer: "Quantized versions are intended for compatible local apps including LM Studio. The best build depends on your hardware.",
  },
  {
    question: "Should I run Qwen 3.8 27B locally or in the cloud?",
    answer: "Local is attractive when you already own suitable hardware and use the model frequently. Cloud GPU rental is attractive when you want to test the model, do not own enough hardware or only need high-performance inference occasionally. API access is usually the simplest operational option.",
  },
]

export function Faq() {
  return (
    <Section title="FAQ" eyebrow="Questions">
      <div className="space-y-3">
        {faqItems.map((item) => (
          <details key={item.question} className="rounded-lg border border-border bg-card p-5">
            <summary className="cursor-pointer text-base font-semibold text-foreground">{item.question}</summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
