import fs from "node:fs/promises";
import assert from "node:assert/strict";
import sharp from "sharp";
const path = process.argv[2];
if (!path)
  throw new Error(
    "Usage: node scripts/audit-revision-project.mjs <exported-demo-project.json>",
  );
const p = JSON.parse(await fs.readFile(path, "utf8"));
assert.equal(
  p.revisions.length,
  4,
  "Expected original plus three accepted demo revisions",
);
const regions = [
  { x: 425, y: 565, width: 175, height: 35 },
  { x: 375, y: 503, width: 275, height: 125 },
  { x: 100, y: 640, width: 550, height: 285 },
];
const images = await Promise.all(
  p.revisions.map(async (r) =>
    sharp(Buffer.from(r.image.split(",")[1], "base64"))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ),
);
const rows = [];
for (let n = 1; n < images.length; n++) {
  const a = images[n - 1],
    b = images[n],
    r = regions[n - 1];
  assert.equal(b.info.width, 1024);
  assert.equal(b.info.height, 1024);
  let outsideChanged = 0,
    insideChanged = 0;
  for (let y = 0; y < 1024; y++)
    for (let x = 0; x < 1024; x++) {
      const i = (y * 1024 + x) * 4;
      if (a.data.subarray(i, i + 4).equals(b.data.subarray(i, i + 4))) continue;
      if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height)
        insideChanged++;
      else outsideChanged++;
    }
  assert.equal(outsideChanged, 0, `Revision ${n} changed protected pixels`);
  assert.ok(insideChanged > 0);
  rows.push({ revision: n, region: r, outsideChanged, insideChanged });
}
console.log(
  JSON.stringify(
    {
      fixture: "RD-BENCH-01",
      method:
        "Browser-exported PNG snapshots decoded with Sharp RGBA, exact comparison against parent",
      revisions: rows,
    },
    null,
    2,
  ),
);
