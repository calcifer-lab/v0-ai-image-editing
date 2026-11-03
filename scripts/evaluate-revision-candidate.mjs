// Offline evaluation of real candidate files; never calls a model or claims semantic correctness.
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { acceptRegions } from "../lib/revision-lab/pixels.ts";

const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("Usage: node --experimental-strip-types scripts/evaluate-revision-candidate.mjs <manifest.json>");
const directory = path.dirname(path.resolve(manifestPath));
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const sourceBytes = await fs.readFile(path.resolve(directory, manifest.source));
const candidateBytes = await fs.readFile(path.resolve(directory, manifest.candidate));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const decode = async (bytes) => {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data) };
};
const source = await decode(sourceBytes);
const originalCandidate = await decode(candidateBytes);
let alignedBytes = candidateBytes;
const resized = source.width !== originalCandidate.width || source.height !== originalCandidate.height;
if (resized) {
  assert.equal(manifest.allowResize, true, "Candidate size mismatch: explicit allowResize required");
  assert.ok(Math.abs(source.width / source.height - originalCandidate.width / originalCandidate.height) <= 0.001, "Aspect ratios differ");
  // This offline normalization uses Sharp, not browser Canvas. Browser export needs its own audit.
  alignedBytes = await sharp(candidateBytes).resize(source.width, source.height, { kernel: "lanczos3" }).png().toBuffer();
}
const candidate = await decode(alignedBytes);
await fs.writeFile(path.join(directory, "candidate-aligned.png"), alignedBytes);
const cases = [];
for (const selection of manifest.selections) {
  assert.match(selection.id, /^[a-z0-9-]+$/, "Unsafe selection ID");
  const { image, stats } = acceptRegions(source, candidate, selection.regions);
  const acceptedBytes = await sharp(Buffer.from(image.data), {
    raw: { width: image.width, height: image.height, channels: 4 },
  }).png().toBuffer();
  const exported = await decode(acceptedBytes);
  let acceptedOutsideChanged = 0, acceptedInsideChanged = 0;
  // Independently check the encoded/decoded PNG, not just acceptRegions' candidate statistics.
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    const offset = (y * source.width + x) * 4;
    if (!exported.data.subarray(offset, offset + 4).some((v, c) => v !== source.data[offset + c])) continue;
    const inside = selection.regions.some((r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
    if (inside) acceptedInsideChanged++; else acceptedOutsideChanged++;
  }
  assert.equal(acceptedOutsideChanged, 0, "Accepted PNG changed protected pixels");
  assert.ok(acceptedInsideChanged > 0, "Candidate did not change selected pixels");
  const output = `accepted-${selection.id}.png`;
  await fs.writeFile(path.join(directory, output), acceptedBytes);
  cases.push({ id: selection.id, regions: selection.regions, selectedFraction: stats.selectedPixels / (source.width * source.height), candidateVsSource: stats, acceptedVsSource: { outsideChanged: acceptedOutsideChanged, insideChanged: acceptedInsideChanged }, output, outputSha256: hash(acceptedBytes), semanticVerdict: "Requires visual review; pixel equality is not a correctness score" });
}
const report = {
  fixture: manifest.id,
  provider: manifest.provider,
  modelId: manifest.modelId ?? null,
  source: { width: source.width, height: source.height, sha256: hash(sourceBytes) },
  candidate: { width: originalCandidate.width, height: originalCandidate.height, sha256: hash(candidateBytes) },
  normalization: resized ? "Explicit same-aspect resize with Sharp lanczos3; not browser Canvas" : "None",
  cases,
};
await fs.writeFile(path.join(directory, "report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
