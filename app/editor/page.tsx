import ElementTransplantEditor from "./transplant-editor"

export const metadata = {
  title: "Element Transplant Editor",
  description: "Extract an element from one image and transplant it into another.",
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <ElementTransplantEditor />
    </main>
  )
}
