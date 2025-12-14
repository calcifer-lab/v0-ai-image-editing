import ImageEditor from "@/components/image-editor"

export const metadata = {
  title: "Editor - AI Image Editor",
  description: "AI-powered image editing workspace",
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <ImageEditor />
    </main>
  )
}
