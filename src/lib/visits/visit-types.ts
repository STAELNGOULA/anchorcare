export type VisitReportListItem = {
  id: string;
  childId: string;
  childFirstName: string;
  doctorName: string;
  appointmentDate: string;
  summaryPreview: string;
  hasPdf: boolean;
};

export type VisitReportDetail = VisitReportListItem & {
  summary: string;
  doctorId: string | null;
  pdfSignedUrl: string | null;
  createdAt: string;
};

export type AdminChildSearchResult = {
  childId: string;
  childName: string;
  parentId: string;
  parentEmail: string;
  parentName: string | null;
};

export type CreateVisitReportInput = {
  childId: string;
  doctorId?: string | null;
  doctorName: string;
  appointmentDate: string;
  summary: string;
  pdfStoragePath?: string | null;
  forceDuplicate?: boolean;
};

export type CreateVisitReportResult =
  | { ok: true; visitId: string; duplicateWarning?: boolean }
  | { ok: false; error: string; duplicateDate?: string };
