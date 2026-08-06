export const CLEARANCE_SHARE_STATUSES = [
  "cleared",
  "restricted",
  "cleared_with_conditions",
] as const;

export type ClearanceShareStatus = (typeof CLEARANCE_SHARE_STATUSES)[number];

export const MAX_CLEARANCE_SUMMARY_CHARS = 500;
export const MAX_CLEARANCE_CONDITIONS_CHARS = 300;

export const FORBIDDEN_CLEARANCE_FIELDS = [
  "clinical_note",
  "visit_report",
  "consult_transcript",
  "diagnosis",
  "physician_notes",
] as const;
