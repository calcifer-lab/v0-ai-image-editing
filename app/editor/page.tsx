import ImageEditor from "@/components/image-editor"
import AuthControls from "@/components/auth/auth-controls"

export const metadata = {
  title: "Fix ReDiagram",
  description: "AI-powered image editing workspace",
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <ImageEditor authSlot={<AuthControls variant="editor" />} />
    </main>
  )
}
