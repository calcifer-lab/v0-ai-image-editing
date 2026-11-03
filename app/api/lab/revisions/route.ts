import { NextResponse } from "next/server";
import sharp from "sharp";
import { validateRegions } from "@/lib/revision-lab/pixels";
import { callGoogleGenerate, extractGoogleImage } from "@/lib/api/google-ai";
export const runtime = "nodejs";
const model = process.env.REVISION_IMAGE_MODEL || "gemini-3-pro-image";
const key = () => process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });
export async function GET() {
  if (process.env.NODE_ENV !== "development")
    return json({ error: "Not found" }, 404);
  return json({ configured: !!key(), model });
}
let running = false;
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development")
    return json({ error: "Not found" }, 404);
  if (
    !["http://127.0.0.1:3100", "http://localhost:3100"].includes(
      request.headers.get("origin") || "",
    ) ||
    request.headers.get("origin") !== `http://${request.headers.get("host")}`
  )
    return json({ error: "仅接受本地页面请求。" }, 403);
  if (!key())
    return json(
      { error: "尚未配置服务端图像模型。可继续导入候选图；不会使用模拟结果。" },
      503,
    );
  if (running) return json({ error: "已有生成任务进行中，请稍后重试。" }, 429);
  running = true;
  try {
    const text = await request.text();
    if (text.length > 16 * 1024 * 1024)
      return json({ error: "图片请求过大。" }, 413);
    const body = JSON.parse(text);
    if (
      typeof body.prompt !== "string" ||
      !body.prompt.trim() ||
      body.prompt.length > 2000 ||
      typeof body.image !== "string" ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(body.image)
    )
      return json({ error: "修改要求或图片格式无效。" }, 400);
    const buffer = Buffer.from(body.image.split(",")[1], "base64");
    const meta = await sharp(buffer, {
      limitInputPixels: 4_194_304,
    }).metadata();
    if (!meta.width || !meta.height || !Array.isArray(body.regions))
      return json({ error: "图片或选区无效。" }, 400);
    validateRegions(body.regions, meta.width, meta.height);
    const response = await callGoogleGenerate(
      model,
      [
        {
          type: "text",
          text: `Edit this business diagram according to the user's request. Preserve all previously accepted content, canvas dimensions, positions, words, numbers and connectors outside these editable rectangles (pixel coordinates on ${meta.width}x${meta.height}): ${JSON.stringify(body.regions)}. Include complete affected nodes and old/new connectors; do not redesign the rest. Return a complete candidate image, not a crop. User request: ${body.prompt}`,
        },
        { type: "image_url", image_url: { url: body.image } },
      ],
      key()!,
      {
        responseModalities: ["TEXT", "IMAGE"],
        signal: AbortSignal.timeout(120000),
      },
    );
    if (!response.ok)
      return json(
        {
          error: `模型服务未成功返回（HTTP ${response.status}），当前版本保持不变。`,
        },
        502,
      );
    const image = extractGoogleImage(response.data);
    if (!image || !/^data:image\/(png|jpeg|webp);base64,/.test(image))
      return json({ error: "模型未返回可用图片。当前版本保持不变。" }, 502);
    return json({ image, model });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.name === "TimeoutError"
            ? "生成超时，当前版本保持不变。"
            : "请求无法处理，请检查图片和选区后重试。",
      },
      400,
    );
  } finally {
    running = false;
  }
}
