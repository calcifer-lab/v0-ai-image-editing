import test from "node:test";
import assert from "node:assert/strict";
import { translateCandidate, selectionsCovered, boundaryCrop, acceptRegions } from "../../lib/revision-lab/pixels.ts";
import sharp from "sharp";

const raster = () => ({ width: 5, height: 4, data: Uint8ClampedArray.from({ length: 80 }, (_, i) => i + 1) });
test("integer translation is reversible within coverage, preserves channels and never mutates input", () => {
  const source = raster(), original = source.data.slice();
  for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const moved = translateCandidate(source, dx, dy);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) {
      const covered = selectionsCovered([{ x, y, width: 1, height: 1 }], 5, 4, dx, dy);
      const offset = (y * 5 + x) * 4;
      assert.deepEqual(moved.data.slice(offset, offset + 4), covered ? source.data.slice(((y - dy) * 5 + x - dx) * 4, ((y - dy) * 5 + x - dx) * 4 + 4) : new Uint8ClampedArray(4));
    }
  }
  assert.deepEqual(source.data, original);
  assert.equal(translateCandidate(source, 0, 0), source);
  assert.throws(() => translateCandidate(source, 0.5, 0));
  assert.throws(() => translateCandidate(source, 65, 0));
  assert.ok(translateCandidate(source, 64, 0).data.every((v) => v === 0));
});
test("uncovered selection blocks acceptance eligibility; aligned acceptance protects outside pixels", () => {
  const source = raster(), region = { x: 1, y: 1, width: 3, height: 2 };
  assert.equal(selectionsCovered([region], 5, 4, 1, 1), true);
  assert.equal(selectionsCovered([region, { x: 0, y: 0, width: 1, height: 1 }], 5, 4, 1, 1), false);
  assert.equal(selectionsCovered([region], 5, 4, -2, 0), false);
  const moved = translateCandidate(source, 1, 1);
  const accepted = acceptRegions(source, moved, [region]).image;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) {
    const i = (y * 5 + x) * 4;
    const expected = x >= 1 && x < 4 && y >= 1 && y < 3 ? moved : source;
    assert.deepEqual(accepted.data.slice(i, i + 4), expected.data.slice(i, i + 4));
  }
});
test("boundary inspection stays in bounds at corners and on tiny images", () => {
  const r = { x: 0, y: 0, width: 1024, height: 1024 };
  assert.deepEqual(boundaryCrop(r, "bottom", 100, 1024, 1024), { x: 928, y: 928, width: 96, height: 96 });
  assert.deepEqual(boundaryCrop(r, "left", 0, 1024, 1024), { x: 0, y: 0, width: 96, height: 96 });
  assert.deepEqual(boundaryCrop({ x: 0, y: 0, width: 5, height: 4 }, "right", 50, 5, 4), { x: 0, y: 0, width: 5, height: 4 });
});

test("known translation of the real model fixture can be corrected without resampling", async () => {
  const file = new URL("../../docs/revision-lab/evaluation/candidate-aligned.png", import.meta.url);
  const original = await sharp(file.pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Independently displace the fixture right 3/up 2 with Sharp, then undo in the product code.
  const padded = await sharp(file.pathname).ensureAlpha().extend({ left: 3, right: 0, top: 0, bottom: 2, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const shifted = await sharp(padded).extract({ left: 0, top: 2, width: 1024, height: 1024 }).raw().toBuffer();
  const corrected = translateCandidate({ width: 1024, height: 1024, data: new Uint8ClampedArray(shifted) }, -3, 2);
  const region = { x: 380, y: 430, width: 260, height: 120 };
  assert.equal(selectionsCovered([region], 1024, 1024, -3, 2), true);
  for (let y = region.y; y < region.y + region.height; y++) {
    const start = (y * 1024 + region.x) * 4;
    assert.deepEqual(Buffer.from(corrected.data.subarray(start, start + region.width * 4)), original.data.subarray(start, start + region.width * 4));
  }
});
