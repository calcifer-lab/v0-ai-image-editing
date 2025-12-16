export async function safeParseJSON(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`API ${res.status}: ${text}`)
  }
}
