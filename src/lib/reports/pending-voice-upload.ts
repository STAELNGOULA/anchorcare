import type { ReportScope } from "@/lib/reports/types";

const DB_NAME = "anchor-voice-uploads";
const STORE = "pending";
const DB_VERSION = 1;

export type PendingVoiceUpload = {
  id: string;
  programId: string;
  blob: Blob;
  durationMs: number;
  scope: ReportScope;
  mimeType: string;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export async function savePendingVoiceUpload(
  entry: PendingVoiceUpload,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getPendingVoiceUpload(
  programId: string,
): Promise<PendingVoiceUpload | null> {
  const db = await openDb();
  const all = await new Promise<PendingVoiceUpload[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as PendingVoiceUpload[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all.find((row) => row.programId === programId) ?? null;
}

export async function clearPendingVoiceUpload(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
