import type { Project } from "./browser";
export type StoredProject = { id: string; updated: number; project: Project };
async function db() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("rediagram-revision-projects", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("projects", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function saveLocalProject(project: Project) {
  const database = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("projects", "readwrite");
      tx.objectStore("projects").put({
        id: project.revisions[0].id,
        updated: Date.now(),
        project,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    database.close();
  }
}
export async function recentProjects(): Promise<StoredProject[]> {
  const database = await db();
  try {
    return await new Promise((resolve, reject) => {
      const r = database
        .transaction("projects")
        .objectStore("projects")
        .getAll();
      r.onsuccess = () =>
        resolve(
          (r.result as StoredProject[]).sort((a, b) => b.updated - a.updated),
        );
      r.onerror = () => reject(r.error);
    });
  } finally {
    database.close();
  }
}
