import test from "node:test";
import assert from "node:assert/strict";
import {
  callGoogleGenerate,
  extractGoogleImage,
} from "../../lib/api/google-ai.ts";
test("provider sends the current input and signal; preserves returned image MIME", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const signal = new AbortController().signal;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.signal, signal);
    const body = JSON.parse(options.body);
    assert.equal(body.contents[0].parts[1].inline_data.data, "YQ==");
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: "image/webp", data: "Yg==" } }],
            },
          },
        ],
      }),
      { status: 200 },
    );
  };
  const r = await callGoogleGenerate(
    "test-model",
    [
      { type: "text", text: "change a node" },
      { type: "image_url", image_url: { url: "data:image/png;base64,YQ==" } },
    ],
    "test-key",
    { signal, responseModalities: ["IMAGE"] },
  );
  assert.equal(r.ok, true);
  assert.equal(extractGoogleImage(r.data), "data:image/webp;base64,Yg==");
});
test("provider failure and text-only response never become a fake image", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  const r = await callGoogleGenerate("test-model", [], "test-key");
  assert.equal(r.ok, false);
  assert.equal(r.status, 503);
  assert.equal(
    extractGoogleImage({
      candidates: [{ content: { parts: [{ text: "Unable to edit" }] } }],
    }),
    null,
  );
});
