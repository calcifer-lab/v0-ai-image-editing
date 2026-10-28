import { validateRaster, type Raster } from "./pixels";
export type Revision = {
  id: string;
  parent: string | null;
  name: string;
  image: string;
};
export type Project = {
  version: 1;
  name: string;
  currentId: string;
  revisions: Revision[];
};
export const MAX_FILE = 24 * 1024 * 1024;
export async function decodeImage(url: string): Promise<Raster> {
  const image = new Image();
  image.src = url;
  await image.decode();
  const width = image.naturalWidth,
    height = image.naturalHeight;
  if (width * height > 4_194_304)
    throw new Error("最多支持 400 万像素，请先缩小图片。");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("浏览器无法处理图片。");
  context.drawImage(image, 0, 0);
  const raster = {
    width,
    height,
    data: context.getImageData(0, 0, width, height).data,
  };
  validateRaster(raster);
  return raster;
}
export function encodeImage(image: Raster) {
  validateRaster(image);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法处理图片。");
  const buffer = context.createImageData(image.width, image.height);
  buffer.data.set(image.data);
  context.putImageData(buffer, 0, 0);
  return canvas.toDataURL("image/png");
}
export async function readImage(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > MAX_FILE
  )
    throw new Error("请选择不超过 24 MB 的 PNG、JPEG 或 WebP。");
  const url = URL.createObjectURL(file);
  try {
    return encodeImage(await decodeImage(url));
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function resizeCandidate(
  url: string,
  width: number,
  height: number,
) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (Math.abs(image.width / image.height - width / height) > 0.001)
    throw new Error("长宽比不同，不能直接对齐；请先在外部工具校正。");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法处理图片。");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}
export async function parseProject(text: string): Promise<Project> {
  if (text.length > 64 * 1024 * 1024)
    throw new Error("项目文件过大（最多 64 MB）。");
  const p = JSON.parse(text);
  if (
    p?.version !== 1 ||
    typeof p.name !== "string" ||
    p.name.length > 200 ||
    !Array.isArray(p.revisions) ||
    !p.revisions.length ||
    p.revisions.length > 12
  )
    throw new Error("不支持的项目格式。");
  const ids = new Set<string>();
  let dimensions = "";
  for (const r of p.revisions) {
    if (
      typeof r.id !== "string" ||
      r.id.length > 100 ||
      ids.has(r.id) ||
      typeof r.name !== "string" ||
      r.name.length > 200 ||
      (r.parent !== null && !ids.has(r.parent)) ||
      typeof r.image !== "string" ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(r.image)
    )
      throw new Error("项目版本数据无效。");
    const image = await decodeImage(r.image);
    const size = `${image.width}x${image.height}`;
    if (dimensions && dimensions !== size)
      throw new Error("项目内图片尺寸不一致。");
    dimensions = size;
    ids.add(r.id);
  }
  if (!ids.has(p.currentId)) throw new Error("当前版本不存在。");
  return {
    version: 1,
    name: p.name,
    currentId: p.currentId,
    revisions: p.revisions.map((r: Revision) => ({
      id: r.id,
      parent: r.parent,
      name: r.name,
      image: r.image,
    })),
  };
}
export function download(data: Blob | string, name: string) {
  const url = typeof data === "string" ? data : URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  if (typeof data !== "string")
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
