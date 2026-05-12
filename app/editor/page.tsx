import ImageEditor from "@/components/image-editor"
import AuthStatus from "@/components/auth/auth-status"

export const metadata = {
  title: "Fix ReDiagram",
  description: "AI-powered image editing workspace",
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <ImageEditor authSlot={<AuthStatus variant="editor" />} />
    </main>
  )
}
