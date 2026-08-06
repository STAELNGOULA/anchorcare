export type ReportScope = "group" | "per_child";

export type DailyReportStatus =
  | "draft"
  | "transcribing"
  | "review"
  | "published"
  | "failed";

export type UploadStatus = "pending" | "uploading" | "uploaded" | "failed";

export type VoiceDraftSummary = {
  id: string;
  programId: string;
  reportDate: string;
  status: DailyReportStatus;
  scope: ReportScope;
  audioDurationMs: number | null;
  uploadStatus: UploadStatus;
  uploadError: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
};
