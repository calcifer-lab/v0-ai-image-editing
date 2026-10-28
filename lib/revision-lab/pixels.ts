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
    throw new Error("图片尺寸无效，最多支持 400 万像素。");
  }
}

export function validateRegions(
  regions: Region[],
  width: number,
  height: number,
) {
  if (!regions.length || regions.length > 32)
    throw new Error("请先框选 1–32 个修改区域。");
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
      throw new Error("选区超出图片范围。");
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
    throw new Error("候选图尺寸与当前图不同，请先明确确认尺寸对齐。");
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
