#!/usr/bin/env node
// One-shot homepage asset optimizer. Run with `node scripts/optimize-images.mjs`.
// Re-encodes oversized homepage source images so Next.js gets a sane input to
// further optimize at request time.
import { promises as fs } from "node:fs"
import path from "node:path"
import sharp from "sharp"

const ROOT = path.resolve(new URL("..", import.meta.url).pathname)

async function pngToJpg(src, { quality = 85 } = {}) {
  const dst = src.replace(/\.png$/i, ".jpg")
  const before = (await fs.stat(src)).size
  await sharp(src)
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toFile(dst)
  const after = (await fs.stat(dst)).size
  await fs.unlink(src)
  return { src, dst, before, after }
}

async function recompressJpg(src, { quality = 80, maxWidth } = {}) {
  const before = (await fs.stat(src)).size
  const tmp = src + ".tmp"
  let pipe = sharp(src)
  if (maxWidth) {
    const m = await sharp(src).metadata()
    if (m.width && m.width > maxWidth) {
      pipe = pipe.resize({ width: maxWidth })
    }
  }
  await pipe.jpeg({ quality, progressive: true, mozjpeg: true }).toFile(tmp)
  await fs.rename(tmp, src)
  const after = (await fs.stat(src)).size
  return { src, dst: src, before, after }
}

function kb(n) {
  return (n / 1024).toFixed(0) + " KB"
}

async function main() {
  const tasks = []

  const cardDirs = [
    "public/homepage_demo_cards/card_1_grill",
    "public/homepage_demo_cards/card_2_wheels",
    "public/homepage_demo_cards/card_3_phoenix",
    "public/homepage_demo_cards/card_4_pavilion",
  ]
  for (const dir of cardDirs) {
    for (const name of ["before.png", "after.png"]) {
      const p = path.join(ROOT, dir, name)
      try {
        await fs.access(p)
        tasks.push(pngToJpg(p, { quality: 85 }))
      } catch {
        // already converted in a prior run
      }
    }
  }

  // Hero poster: published as .jpg but actually PNG-encoded; re-encode as real
  // JPEG and cap width at 1600 since it never renders larger than the hero.
  const poster = path.join(ROOT, "public/videos/hero-poster.jpg")
  tasks.push(recompressJpg(poster, { quality: 78, maxWidth: 1600 }))

  const results = await Promise.all(tasks)
  let totalBefore = 0
  let totalAfter = 0
  for (const r of results) {
    totalBefore += r.before
    totalAfter += r.after
    console.log(
      `${path.relative(ROOT, r.src)} → ${path.relative(ROOT, r.dst)}: ${kb(r.before)} → ${kb(r.after)} (${(100 - (r.after / r.before) * 100).toFixed(0)}% off)`,
    )
  }
  console.log(
    `\nTotal: ${kb(totalBefore)} → ${kb(totalAfter)} (${(100 - (totalAfter / totalBefore) * 100).toFixed(0)}% off)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
