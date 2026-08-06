export type ReportDetailPhoto = {
  id: string;
  signedUrl: string;
  alt: string;
};

export type ReportDetailPayload = {
  state: "valid";
  childId: string;
  childFirstName: string;
  childLastName: string;
  dailyReportId: string;
  reportChildId: string;
  timelineEventId: string | null;
  reportDate: string;
  programId: string;
  programName: string;
  orgName: string;
  orgAccentColor: string;
  reportBody: string;
  coachNotes: string | null;
  transcript: string | null;
  photos: ReportDetailPhoto[];
  photoCount: number;
  coachName: string | null;
  publishedAt: string | null;
  amendedAt: string | null;
  shareSafe: boolean;
};

export type ReportDetailPaywall = {
  state: "paywalled";
  childFirstName: string;
  reportDate: string;
  programName: string;
  orgName: string;
};

export type ReportDetailUnavailable = {
  state: "unavailable";
  reason: "not_found" | "not_published" | "forbidden";
};

export type ReportDetailResult =
  | ReportDetailPayload
  | ReportDetailPaywall
  | ReportDetailUnavailable;
