export async function resizeImage(
  file: Blob,
  maxSize = 1536,
  quality = 0.85
): Promise<Blob> {
  const img = await createImageBitmap(file)

  const scale = Math.min(
    maxSize / img.width,
    maxSize / img.height,
    1
  )

  const canvas = document.createElement("canvas")
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return new Promise(resolve => {
    canvas.toBlob(
      blob => resolve(blob!),
      "image/jpeg",
      quality
    )
  })
}
