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
    return json({ error: "Only local same-origin requests are allowed." }, 403);
  if (!key())
    return json(
      { error: "Image generation is not configured. Import a candidate to continue. No simulated results will be returned." },
      503,
    );
  if (running) return json({ error: "A generation is already running. Please try again later." }, 429);
  running = true;
  try {
    const text = await request.text();
    if (text.length > 16 * 1024 * 1024)
      return json({ error: "Image request is too large." }, 413);
    const body = JSON.parse(text);
    if (
      typeof body.prompt !== "string" ||
      !body.prompt.trim() ||
      body.prompt.length > 2000 ||
      typeof body.image !== "string" ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(body.image)
    )
      return json({ error: "Invalid edit instructions or image format." }, 400);
    const buffer = Buffer.from(body.image.split(",")[1], "base64");
    const meta = await sharp(buffer, {
      limitInputPixels: 4_194_304,
    }).metadata();
    if (!meta.width || !meta.height || !Array.isArray(body.regions))
      return json({ error: "Invalid image or selection." }, 400);
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
          error: `Generation failed (HTTP ${response.status}). Your current version is unchanged.`,
        },
        502,
      );
    const image = extractGoogleImage(response.data);
    if (!image || !/^data:image\/(png|jpeg|webp);base64,/.test(image))
      return json({ error: "The model returned no usable image. Your current version is unchanged." }, 502);
    return json({ image, model });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.name === "TimeoutError"
            ? "Generation timed out. Your current version is unchanged."
            : "Could not process the request. Check the image and selection, then retry.",
      },
      400,
    );
  } finally {
    running = false;
  }
}
