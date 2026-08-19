type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

export function track(event: string, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return

  const payload = {
    event,
    props,
    path: window.location.pathname,
    referrer: document.referrer || null,
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", payload)
    return
  }

  window
    .fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    .catch(() => {
      // Analytics must never affect page behavior.
    })
}
