import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
import {
  ModelLink,
  ModelPageTracking,
  ModelPlayground,
} from "@/components/models/model-playground";
import {
  MODEL_PATH,
  sources,
  pythonExample,
  jsExample,
  opencodeConfig,
} from "@/lib/models/deepseek";
const title = "DeepSeek V4.1 Flash 1017 API & OpenCode Guide | ReDiagram";
const description =
  "Connect DeepSeek V4.1 Flash 1017 with Python, JavaScript and OpenCode. Official API IDs, working request examples, token pricing and setup guidance.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: SITE_URL + MODEL_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: SITE_URL + MODEL_PATH,
    type: "website",
    images: [SITE_URL + MODEL_PATH + "/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [SITE_URL + MODEL_PATH + "/opengraph-image"],
  },
};
const section = "scroll-mt-8 border-t py-12";
function Code({ title, children }: { title: string; children: string }) {
  return (
    <div className="my-5 min-w-0 overflow-hidden rounded-xl border bg-slate-950 text-slate-100">
      <h3 className="border-b border-slate-700 px-5 py-3 text-xs">{title}</h3>
      <pre
        tabIndex={0}
        aria-label={title}
        className="overflow-x-auto p-5 text-xs leading-6"
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <header className="border-b">
        <nav
          aria-label="Model navigation"
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5"
        >
          <Link href="/" className="font-semibold">
            ReDiagram
          </Link>
          <div className="flex gap-5 text-sm">
            <a href="#playground">Playground</a>
            <a href="#api">API</a>
            <a href="#opencode">OpenCode</a>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        <ModelPageTracking />
        <div className="mx-auto max-w-3xl pt-12 text-center sm:pt-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            ReDiagram Labs
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            DeepSeek V4.1 Flash 1017
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Connect the model to your workflow.
            <br />
            Build with the official API.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
            {["Python & JavaScript", "OpenCode setup", "Official API"].map(
              (x) => (
                <span className="rounded-full border px-3 py-1.5" key={x}>
                  {x}
                </span>
              ),
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Independent testing page. Not affiliated with DeepSeek.
          </p>
        </div>
        <ModelPlayground />
        <p className="mb-10 text-xs leading-6 text-muted-foreground">
          The official API uses the <code>deepseek-flash</code> alias, mapped
          to 1017 as checked on October 18, 2026. The alias can advance. No
          snapshot-pinned endpoint has been verified.{" "}
          <a className="underline" href={sources.updates}>
            Release notes ↗
          </a>
        </p>
        <section className={section} id="examples">
          <h2 className="text-2xl font-semibold">
            Start with a small, useful task.
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="font-medium">Explain a concept</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Explain a database index in three sentences, with one practical
                tradeoff.
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="font-medium">Review a function</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Paste a short function and ask for edge cases. Remove
                credentials and private data first.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Prompts are suggestions, not pre-generated model outputs.
          </p>
        </section>
        <section className={section} id="api">
          <h2 className="text-2xl font-semibold">
            Use the API in your application.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Create a personal key in the DeepSeek console, store it in a server
            environment variable, and call the Chat Completions endpoint with
            model <code>deepseek-flash</code>. These examples use non-thinking
            mode and a 512-token output cap.
          </p>
          <div className="mt-4">
            <ModelLink href={sources.console}>
              Get official API access
            </ModelLink>
          </div>
          <Code title="Python · pip install openai">{pythonExample}</Code>
          <Code title="JavaScript · server-side fetch">{jsExample}</Code>
          <p className="text-sm leading-7 text-muted-foreground">
            Authentication errors: verify the key and Bearer header.
            Insufficient balance: check the provider console. Rate limits:
            reduce concurrency and retry later. Timeouts: shorten the request;
            provider usage may still be charged. Never put your provider key
            into frontend code.
          </p>
          <a className="mt-4 inline-block text-sm underline" href={sources.api}>
            Official API documentation ↗
          </a>
        </section>
        <section className={section} id="opencode">
          <h2 className="text-2xl font-semibold">
            Connect DeepSeek to OpenCode.
          </h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7">
            <li>Create your DeepSeek API key.</li>
            <li>
              Run <code>/connect</code> in OpenCode, choose DeepSeek, and enter
              the key locally.
            </li>
            <li>
              Run <code>/models</code> and choose Flash. Confirm the API ID is{" "}
              <code>deepseek-flash</code>.
            </li>
          </ol>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            If your catalog does not include the model, run{" "}
            <code>/connect</code> → Other and use provider ID{" "}
            <code>deepseek-direct</code>. Add this documented
            compatible-provider configuration to <code>opencode.json</code>,
            then select it under <code>/models</code>.
          </p>
          <Code title="opencode.json · custom-provider fallback">
            {opencodeConfig}
          </Code>
          <p className="text-sm leading-7 text-muted-foreground">
            The provider ID must match your saved credential. OpenCode stores
            credentials locally; do not share that file. This follows the
            documented API format, but an end-to-end OpenCode agent run has not
            been independently tested here.
          </p>
          <div className="mt-4 flex flex-wrap gap-5 text-sm underline">
            <a href={sources.opencode}>DeepSeek provider guide ↗</a>
            <a href={sources.custom}>Custom-provider guide ↗</a>
          </div>
        </section>
        <section className={section} id="pricing">
          <h2 className="text-2xl font-semibold">
            Understand your token usage.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            API responses report input and output token usage.
            DeepSeek’s published rates per million tokens are $0.15–$0.30 for
            uncached input, $0.003–$0.006 for cached input, and $0.60–$1.20 for
            output. Ranges reflect off-peak and peak pricing. Actual billing is
            determined by the provider; elapsed time is not an invoice.
          </p>
          <a
            className="mt-4 inline-block text-sm underline"
            href={sources.pricing}
          >
            Current official pricing and time windows ↗
          </a>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            ReDiagram does not currently sell model API credits or issue
            personal model API keys. The official provider is the available
            API-access path. Our API commercialization remains a later stage.
          </p>
        </section>
        <section className={section} id="benchmarks">
          <h2 className="text-2xl font-semibold">
            Need the model research first?
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            DeepSeek reports 42.3 on Terminal-Bench 4.0 and 77.0 on DeepSWE v1.1
            for 1017. These are official benchmark results, not ReDiagram tests.
            Read the source for harness details.
          </p>
          <div className="mt-4 flex flex-wrap gap-5 text-sm underline">
            <a href={sources.weights}>Official model card ↗</a>
  {false ? (          <a href="https://tryjevai.com/deepseek-v4-1-flash-1017">
              Jev model research ↗
            </a>) : <span className="text-muted-foreground">Jev model research · Coming soon</span>}
          </div>
        </section>
        <section className={section}>
          <h2 className="text-2xl font-semibold">Before you run.</h2>
          {[
            [
              "Is this a fixed 1017 snapshot?",
              "No. The provider alias currently maps to 1017; future releases may change that mapping.",
            ],
            [
              "Why is the trial unavailable?",
              "Live access stays off until a server key, protection rules and real-call verification are ready. No sample output is substituted.",
            ],
            [
              "Can I use my own API key here?",
              "This page does not accept keys. Use your key on your own server with the examples above.",
            ],
            [
              "Is this an image generator?",
              "No. This is an API integration guide for DeepSeek. The model supports vision, but this page does not accept images or generate images.",
            ],
            [
              "How are results measured?",
              "Server elapsed time is measured around the provider request, not time to first token. Usage comes from the provider response. Individual calls are not independent benchmarks.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="border-b py-5">
              <summary className="cursor-pointer text-sm font-medium">
                {q}
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </section>
      </main>
      <footer className="border-t p-6 text-center text-sm text-muted-foreground">
        <Link href="/">ReDiagram</Link> · Independent model testing ·{" "}
        <Link href="/privacy">Privacy</Link>
      </footer>
    </>
  );
}
