"use client";
import { sendGAEvent } from "@next/third-parties/google";
const events = new Set([
  "model_page_view",
  "playground_run",
  "playground_success",
  "playground_error",
  "api_access_click",
]);
export function trackEvent(
  event: string,
  params: Record<string, string | number> = {},
) {
  if (typeof window === "undefined" || !events.has(event)) return;
  const query = new URLSearchParams(window.location.search);
  let source = "direct";
  try {
    if (query.get("analytics") === "off")
      sessionStorage.setItem("rd.model.analytics.off", "1");
    if (query.get("analytics") === "on")
      sessionStorage.removeItem("rd.model.analytics.off");
    if (sessionStorage.getItem("rd.model.analytics.off") === "1") return;
    if (
      query.get("utm_source") === "tryjevai" &&
      query.get("utm_medium") === "referral" &&
      query.get("utm_campaign") === "deepseek_1017"
    )
      sessionStorage.setItem("rd.model.source", "tryjevai");
    if (sessionStorage.getItem("rd.model.source") === "tryjevai")
      source = "tryjevai";
  } catch {
    if (query.get("analytics") === "off") return;
  }
  const safe: Record<string, string> = {
    provider: "deepseek",
    model: "deepseek-flash",
    source,
    location: "/deepseek-v4-1-flash-1017",
  };
  if (
    typeof params.error_type === "string" &&
    /^(network|validation|invalid_response|timeout|http_[45][0-9]{2})$/.test(
      params.error_type,
    )
  )
    safe.error_type = params.error_type;
  const target = window as unknown as { dataLayer?: unknown[] };
  target.dataLayer = target.dataLayer || [];
  sendGAEvent("event", event, safe);
}
