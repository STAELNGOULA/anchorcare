export const INCIDENT_AMEND_WINDOW_MS = 24 * 60 * 60 * 1000;

export const INCIDENT_AMENDABLE_FIELDS = [
  "location",
  "mechanism",
  "body_area",
  "symptoms",
  "pain_level",
  "action_taken",
  "witnesses",
] as const;

export type IncidentAmendableField = (typeof INCIDENT_AMENDABLE_FIELDS)[number];

export const INCIDENT_PHOTOS_BUCKET = "photos";

export const INCIDENT_SIGNED_URL_TTL = 3600;

export type ParentIncidentAction =
  | "book_doctor"
  | "request_consult"
  | "talk_to_team"
  | "share_clearance"
  | "handling"
  | "call_911";

export const PARENT_INCIDENT_ACTIONS: ParentIncidentAction[] = [
  "book_doctor",
  "request_consult",
  "talk_to_team",
  "share_clearance",
  "handling",
  "call_911",
];
