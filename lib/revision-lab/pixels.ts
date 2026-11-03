export type Raster = { width: number; height: number; data: Uint8ClampedArray };
export type Region = { x: number; y: number; width: number; height: number };
const MAX_PIXELS = 4_194_304;

export function validateRaster(image: Raster) {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width < 1 ||
    image.height < 1 ||
    image.width * image.height > MAX_PIXELS ||
    image.data.length !== image.width * image.height * 4
  ) {
    throw new Error("Invalid image dimensions. The limit is 4 megapixels.");
  }
}

export function validateRegions(
  regions: Region[],
  width: number,
  height: number,
) {
  if (!regions.length || regions.length > 32)
    throw new Error("Select between 1 and 32 areas to edit.");
  for (const r of regions) {
    if (
      ![r.x, r.y, r.width, r.height].every(Number.isInteger) ||
      r.x < 0 ||
      r.y < 0 ||
      r.width < 1 ||
      r.height < 1 ||
      r.x + r.width > width ||
      r.y + r.height > height
    )
      throw new Error("Selection is outside the image bounds.");
  }
}

// Exact equality is defined on decoded RGBA, not compressed file bytes.
// No blur, scaling, alpha compositing, or fallback to a raw model output.
export function acceptRegions(
  base: Raster,
  candidate: Raster,
  regions: Region[],
) {
  validateRaster(base);
  validateRaster(candidate);
  if (base.width !== candidate.width || base.height !== candidate.height)
    throw new Error("Candidate dimensions differ. Confirm resizing before accepting.");
  validateRegions(regions, base.width, base.height);
  const data = new Uint8ClampedArray(base.data);
  const selected = new Uint8Array(base.width * base.height);
  for (const r of regions)
    for (let y = r.y; y < r.y + r.height; y++)
      selected.fill(1, y * base.width + r.x, y * base.width + r.x + r.width);
  let outsideChanged = 0,
    insideChanged = 0,
    outsideVisibleChanged = 0,
    selectedPixels = 0;
  for (let p = 0; p < selected.length; p++) {
    const offset = p * 4;
    let difference = 0;
    for (let c = 0; c < 4; c++)
      difference = Math.max(
        difference,
        Math.abs(base.data[offset + c] - candidate.data[offset + c]),
      );
    if (selected[p]) {
      selectedPixels++;
      if (difference) insideChanged++;
      for (let c = 0; c < 4; c++) data[offset + c] = candidate.data[offset + c];
    } else if (difference) {
      outsideChanged++;
      if (difference > 16) outsideVisibleChanged++;
    }
  }
  return {
    image: { width: base.width, height: base.height, data },
    stats: {
      outsideChanged,
      outsideVisibleChanged,
      insideChanged,
      selectedPixels,
      protectedPixels: selected.length - selectedPixels,
    },
  };
}


export const MAX_OFFSET = 64;
export function translateCandidate(image: Raster, dx: number, dy: number): Raster {
  validateRaster(image);
  if (![dx, dy].every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_OFFSET))
    throw new Error("Alignment must be an integer offset within 64 pixels.");
  if (!dx && !dy) return image;
  const data = new Uint8ClampedArray(image.data.length);
  const startX = Math.max(0, dx), endX = Math.min(image.width, image.width + dx);
  if (endX <= startX) return { ...image, data };
  for (let y = Math.max(0, dy); y < Math.min(image.height, image.height + dy); y++) {
    const source = ((y - dy) * image.width + startX - dx) * 4;
    data.set(image.data.subarray(source, source + (endX - startX) * 4), (y * image.width + startX) * 4);
  }
  return { ...image, data };
}

export function selectionsCovered(regions: Region[], width: number, height: number, dx: number, dy: number) {
  return regions.every((r) => r.x >= Math.max(0, dx) && r.y >= Math.max(0, dy) &&
    r.x + r.width <= Math.min(width, width + dx) && r.y + r.height <= Math.min(height, height + dy));
}

export type Edge = "top" | "right" | "bottom" | "left";
export function boundaryCrop(region: Region, edge: Edge, position: number, width: number, height: number) {
  const t = Math.max(0, Math.min(100, position)) / 100;
  const x = edge === "left" ? region.x : edge === "right" ? region.x + region.width : region.x + region.width * t;
  const y = edge === "top" ? region.y : edge === "bottom" ? region.y + region.height : region.y + region.height * t;
  const w = Math.min(96, width), h = Math.min(96, height);
  return { x: Math.max(0, Math.min(width - w, Math.round(x - w / 2))), y: Math.max(0, Math.min(height - h, Math.round(y - h / 2))), width: w, height: h };
}
