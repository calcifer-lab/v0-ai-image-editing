/**
 * Headers OpenRouter recommends on every chat-completions request so that
 * traffic is attributed to our app. Without these, some upstream providers
 * apply stricter routing/abuse rules and may return "violation of provider
 * Terms Of Service" 403s.
 *
 * https://openrouter.ai/docs/api-reference/overview#headers
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rediagram.com"
const SITE_TITLE = process.env.OPENROUTER_APP_TITLE || "Rediagram"

export function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_TITLE,
  }
}
