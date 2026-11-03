import test from "node:test";
import assert from "node:assert/strict";
import { acceptRegions } from "../../lib/revision-lab/pixels.ts";
const raster = (width = 4, height = 3, value = 20) => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4).fill(value),
});
test("only selected RGBA pixels change, including transparent pixels; inputs are immutable", () => {
  const base = raster(),
    candidate = raster(4, 3, 200);
  base.data[3] = 0;
  const before = base.data.slice();
  const { image, stats } = acceptRegions(base, candidate, [
    { x: 1, y: 1, width: 2, height: 1 },
  ]);
  for (let p = 0; p < 12; p++)
    for (let c = 0; c < 4; c++)
      assert.equal(
        image.data[p * 4 + c],
        p === 5 || p === 6 ? 200 : before[p * 4 + c],
      );
  assert.deepEqual(base.data, before);
  assert.equal(stats.outsideChanged, 10);
  assert.equal(stats.insideChanged, 2);
});
test("overlapping regions are counted once and border pixels remain exact", () => {
  const result = acceptRegions(raster(), raster(4, 3, 90), [
    { x: 0, y: 0, width: 2, height: 2 },
    { x: 1, y: 1, width: 2, height: 2 },
  ]);
  assert.equal(result.stats.selectedPixels, 7);
  assert.equal(result.stats.protectedPixels, 5);
});
test("size mismatch, fractional/out-of-bounds/empty masks and corrupt buffers fail closed", () => {
  assert.throws(() =>
    acceptRegions(raster(), raster(3, 3), [
      { x: 0, y: 0, width: 1, height: 1 },
    ]),
  );
  for (const regions of [
    [],
    [{ x: -1, y: 0, width: 1, height: 1 }],
    [{ x: 3, y: 0, width: 2, height: 1 }],
    [{ x: 0.1, y: 0, width: 1, height: 1 }],
  ])
    assert.throws(() => acceptRegions(raster(), raster(), regions));
  assert.throws(() =>
    acceptRegions(
      { width: 4, height: 3, data: new Uint8ClampedArray(2) },
      raster(),
      [{ x: 0, y: 0, width: 1, height: 1 }],
    ),
  );
});
test("sequential edits preserve a previous accepted region even when the next candidate reverts it", () => {
  const first = acceptRegions(raster(), raster(4, 3, 80), [
    { x: 0, y: 0, width: 1, height: 1 },
  ]).image;
  const next = acceptRegions(first, raster(4, 3, 120), [
    { x: 3, y: 2, width: 1, height: 1 },
  ]).image;
  assert.equal(next.data[0], 80);
  assert.equal(next.data[44], 120);
  assert.equal(next.data[4], 20);
});
test("tiny exact differences are separate from high-contrast differences", () => {
  const result = acceptRegions(raster(), raster(4, 3, 21), [
    { x: 0, y: 0, width: 1, height: 1 },
  ]);
  assert.equal(result.stats.outsideChanged, 11);
  assert.equal(result.stats.outsideVisibleChanged, 0);
});
