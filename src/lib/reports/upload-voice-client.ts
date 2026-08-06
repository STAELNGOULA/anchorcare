import type { ReportScope } from "@/lib/reports/types";
import type { VoiceDraftSummary } from "@/lib/reports/types";

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadVoiceClientResult =
  | { ok: true; draft: VoiceDraftSummary }
  | { ok: false; error: string };

export function uploadVoiceRecordingClient(
  programId: string,
  blob: Blob,
  durationMs: number,
  scope: ReportScope,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadVoiceClientResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    const fileName = blob.type.includes("mp4") ? "recording.m4a" : "recording.webm";
    form.append("audio", blob, fileName);
    form.append("durationMs", String(durationMs));
    form.append("scope", scope);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      });
    });

    xhr.addEventListener("load", () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          draft?: VoiceDraftSummary;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && body.draft) {
          resolve({ ok: true, draft: body.draft });
          return;
        }
        resolve({ ok: false, error: body.error ?? "Upload failed" });
      } catch {
        resolve({ ok: false, error: "Upload failed" });
      }
    });

    xhr.addEventListener("error", () => {
      resolve({ ok: false, error: "Network error" });
    });

    xhr.addEventListener("abort", () => {
      resolve({ ok: false, error: "Upload cancelled" });
    });

    xhr.open("POST", `/api/coach/report/${programId}/voice`);
    xhr.send(form);
  });
}
