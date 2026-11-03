import { notFound } from "next/navigation";
import RevisionWorkbench from "@/components/revision-lab/workbench";

export const metadata = {
  title: "ReDiagram · Revision Studio",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function RevisionLabPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <RevisionWorkbench />;
}
