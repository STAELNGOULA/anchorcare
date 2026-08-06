export type SmsReportViewState =
  | "valid"
  | "invalid"
  | "expired"
  | "revoked"
  | "max_views"
  | "not_published"
  | "rate_limited";

export type SmsReportBranding = {
  orgName: string;
  logoUrl: string | null;
  accentColor: string;
};

export type SmsReportPayload = {
  state: "valid";
  childFirstName: string;
  reportDate: string;
  reportText: string;
  transcript: string | null;
  photoCount: number;
  branding: SmsReportBranding;
  programName: string;
  parentId: string | null;
  childId: string;
  dailyReportId: string;
  deepLinkPath: string;
  viewerIsParent: boolean;
};

export type SmsReportError = {
  state: Exclude<SmsReportViewState, "valid">;
  retryAfterSeconds?: number;
};

export type SmsReportResult = SmsReportPayload | SmsReportError;
