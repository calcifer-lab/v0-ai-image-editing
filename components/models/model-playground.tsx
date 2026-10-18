"use client";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/models/analytics";
export function ModelPageTracking() {
  const viewed = useRef(false);
  useEffect(() => {
    if (!viewed.current) {
      trackEvent("model_page_view");
      viewed.current = true;
    }
  }, []);
  return null;
}
export function ModelLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
      href={href}
      onClick={() => trackEvent("api_access_click")}
    >
      {children} ↗
    </a>
  );
}
export function ModelPlayground() {
  return (
    <section
      id="playground"
      className="my-8 rounded-2xl border bg-muted/40 p-7 text-center sm:my-10 sm:p-10"
    >
      <h2 className="text-xl font-semibold">Online playground · Coming soon</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
        Start with the official API examples below. Online testing will open
        after account access, quotas and usage tracking are ready.
      </p>
      <a
        href="#api"
        className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Explore API examples ↓
      </a>
    </section>
  );
}
