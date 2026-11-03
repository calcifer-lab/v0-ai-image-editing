"use client";

import { useEffect, useRef, useState } from "react";
import { boundaryCrop, type Edge, type Raster, type Region } from "@/lib/revision-lab/pixels";
import s from "./workbench.module.css";

function Detail({ image, crop, regions, label, guides }: { image: Raster; crop: Region; regions: Region[]; label: string; guides: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const pixels = ctx.createImageData(crop.width, crop.height);
    for (let y = 0; y < crop.height; y++) {
      const start = ((crop.y + y) * image.width + crop.x) * 4;
      pixels.data.set(image.data.subarray(start, start + crop.width * 4), y * crop.width * 4);
    }
    ctx.putImageData(pixels, 0, 0);
    if (guides) {
      ctx.strokeStyle = "#c4782b";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      for (const r of regions) ctx.strokeRect(r.x - crop.x, r.y - crop.y, r.width, r.height);
    }
  }, [image, crop, regions, guides]);
  return <figure><figcaption>{label}</figcaption><canvas ref={ref} width={crop.width} height={crop.height} role="img" aria-label={`${label}: enlarged selection boundary`} /></figure>;
}

export default function BoundaryInspector({ base, candidate, accepted, regions }: { base: Raster; candidate: Raster; accepted: Raster; regions: Region[] }) {
  const [index, setIndex] = useState(0);
  const [edge, setEdge] = useState<Edge>("top");
  const [position, setPosition] = useState(50);
  const [guides, setGuides] = useState(true);
  const selected = Math.min(index, regions.length - 1);
  const crop = boundaryCrop(regions[selected], edge, position, base.width, base.height);
  return <section className={s.inspector} aria-label="Boundary inspection">
    <h2>Inspect before accepting</h2>
    <p>Compare the same detail in all three views. Look for broken lines, doubled edges, and background seams. This is a visual check, not automatic validation.</p>
    <div className={s.toolbar}>
      <label>Selection <select value={selected} onChange={(e) => setIndex(Number(e.target.value))}>{regions.map((_, i) => <option value={i} key={i}>{i + 1}</option>)}</select></label>
      <label>Edge <select value={edge} onChange={(e) => setEdge(e.target.value as Edge)}>{(["top", "right", "bottom", "left"] as const).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Along edge <input type="range" min={0} max={100} value={position} onChange={(e) => setPosition(Number(e.target.value))} /> {position}%</label>
      <label><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> Boundary guides</label>
    </div>
    <div className={s.detailGrid}>
      <Detail label="Current version" image={base} crop={crop} regions={regions} guides={guides} />
      <Detail label="Aligned candidate" image={candidate} crop={crop} regions={regions} guides={guides} />
      <Detail label="Selection preview" image={accepted} crop={crop} regions={regions} guides={guides} />
    </div>
    <p>{crop.width} × {crop.height} source pixels, enlarged · x {crop.x}, y {crop.y}. Guides appear only here, never in exports. For connection edits, also check the whole diagram for missing or incorrect paths.</p>
  </section>;
}
