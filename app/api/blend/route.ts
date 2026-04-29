import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

interface BlendRegion {
  x: number
  y: number
  width: number
  height: number
}

interface BlendRequest {
  mainImage: string
  elementImage: string
  mainRegion: BlendRegion
  elementRegion: BlendRegion
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function isDataUrl(value: string) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeRegion(region: BlendRegion, imageWidth: number, imageHeight: number): BlendRegion {
  const x = clamp(Math.round(region.x), 0, Math.max(0, imageWidth - 1))
  const y = clamp(Math.round(region.y), 0, Math.max(0, imageHeight - 1))
  const width = clamp(Math.round(region.width), 1, Math.max(1, imageWidth - x))
  const height = clamp(Math.round(region.height), 1, Math.max(1, imageHeight - y))

  return { x, y, width, height }
}

async function imageInputToBuffer(input: string): Promise<Buffer> {
  if (isDataUrl(input)) {
    return Buffer.from(input.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, ""), "base64")
  }

  if (isHttpUrl(input)) {
    const response = await fetch(input)
    if (!response.ok) {
      throw new Error(`Failed to fetch image URL: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  throw new Error("Image input must be a base64 data URL or http(s) URL")
}

function bufferToDataUrl(buffer: Buffer, mimeType: string = "image/png") {
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BlendRequest
    const { mainImage, elementImage, mainRegion, elementRegion } = body

    if (!mainImage || !elementImage || !mainRegion || !elementRegion) {
      return NextResponse.json({ error: "mainImage, elementImage, mainRegion, and elementRegion are required" }, { status: 400 })
    }

    const [mainBuffer, elementBuffer] = await Promise.all([imageInputToBuffer(mainImage), imageInputToBuffer(elementImage)])
    const [mainMetadata, elementMetadata] = await Promise.all([sharp(mainBuffer).metadata(), sharp(elementBuffer).metadata()])

    if (!mainMetadata.width || !mainMetadata.height || !elementMetadata.width || !elementMetadata.height) {
      return NextResponse.json({ error: "Unable to read image metadata" }, { status: 400 })
    }

    const normalizedMainRegion = normalizeRegion(mainRegion, mainMetadata.width, mainMetadata.height)
    const normalizedElementRegion = normalizeRegion(elementRegion, elementMetadata.width, elementMetadata.height)

    const croppedElement = await sharp(elementBuffer)
      .extract({
        left: normalizedElementRegion.x,
        top: normalizedElementRegion.y,
        width: normalizedElementRegion.width,
        height: normalizedElementRegion.height,
      })
      .resize(normalizedMainRegion.width, normalizedMainRegion.height, {
        fit: "fill",
      })
      .png()
      .toBuffer()

    const composited = await sharp(mainBuffer)
      .composite([
        {
          input: croppedElement,
          left: normalizedMainRegion.x,
          top: normalizedMainRegion.y,
          blend: "over",
        },
      ])
      .png()
      .toBuffer()

    return NextResponse.json({
      result: bufferToDataUrl(composited),
      meta: {
        mainRegion: normalizedMainRegion,
        elementRegion: normalizedElementRegion,
      },
    })
  } catch (error) {
    console.error("[Blend] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to blend images" },
      { status: 500 }
    )
  }
}
