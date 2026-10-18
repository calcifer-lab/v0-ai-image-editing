export const MODEL_PATH = "/deepseek-v4-1-flash-1017";
export const MODEL_ID = "deepseek-flash";
export const MODEL_NAME = "DeepSeek V4.1 Flash 1017";
export const sources = {
  api: "https://api-docs.deepseek.com/",
  pricing: "https://api-docs.deepseek.com/quick_start/pricing/",
  updates: "https://api-docs.deepseek.com/updates/",
  weights: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017",
  opencode: "https://opencode.ai/docs/providers/#deepseek",
  custom: "https://opencode.ai/docs/providers/#custom-provider",
  console: "https://platform.deepseek.com/",
};
export const pythonExample = `# pip install openai
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["DEEPSEEK_API_KEY"],
                base_url="https://api.deepseek.com",
                timeout=25, max_retries=0)
result = client.chat.completions.create(
    model="deepseek-flash",
    messages=[{"role":"user", "content":"Explain a database index in three sentences."}],
    max_tokens=512,
    extra_body={"thinking":{"type":"disabled"}},
)
print(result.choices[0].message.content)
print(result.usage)`;
export const jsExample = `// Server-side JavaScript (Node 22+). Never expose keys in a browser.
const response = await fetch("https://api.deepseek.com/chat/completions", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.DEEPSEEK_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "deepseek-flash",
    messages: [{ role: "user", content: "Explain a database index in three sentences." }],
    thinking: { type: "disabled" }, max_tokens: 512, stream: false,
  }),
  signal: AbortSignal.timeout(25000),
});
if (!response.ok) throw new Error(\`DeepSeek HTTP \${response.status}\`);
const result = await response.json();
console.log(result.choices[0].message.content, result.usage);`;
export const opencodeConfig = JSON.stringify(
  {
    $schema: "https://opencode.ai/config.json",
    provider: {
      "deepseek-direct": {
        npm: "@ai-sdk/openai-compatible",
        name: "DeepSeek direct",
        options: { baseURL: "https://api.deepseek.com/v1" },
        models: { "deepseek-flash": { name: "DeepSeek Flash (latest alias)" } },
      },
    },
  },
  null,
  2,
);
