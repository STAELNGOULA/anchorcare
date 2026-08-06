export type TodayIncidentAlert = {
  eventId: string;
  incidentId: string | null;
  title: string;
  summary: string | null;
  occurredAt: string;
};

export type TodayReportSnippet = {
  eventId: string;
  reportChildId: string | null;
  dailyReportId: string | null;
  summary: string | null;
  occurredAt: string;
  photoCount: number;
};

export type TodayPickupEta = {
  id: string;
  minutesLate: number;
  note: string | null;
  expectedAt: string;
  programName: string | null;
};

export type TodayFormExpiryAlert = {
  formId: string;
  title: string;
  expiresAt: string;
  daysUntil: number;
};

export type TodayMorningHealth = {
  healthStatus: "healthy" | "mild_symptoms" | "staying_home";
  note: string | null;
};

export type TodayChildCard = {
  childId: string;
  firstName: string;
  lastName: string;
  photoSignedUrl: string | null;
  programId: string | null;
  programName: string | null;
  registrationStatus: "pending" | "active" | "withdrawn" | null;
  latestReport: TodayReportSnippet | null;
  incidentAlert: TodayIncidentAlert | null;
  pickupEta: TodayPickupEta | null;
  morningHealth: TodayMorningHealth | null;
  isNew: boolean;
  waitingForFirstReport: boolean;
};

export type ParentTodayFeed = {
  greetingName: string;
  dateLabel: string;
  lastVisitAt: string | null;
  children: TodayChildCard[];
  formExpiryAlerts: TodayFormExpiryAlert[];
  hasPrograms: boolean;
  hasChildren: boolean;
};

export type EngagementEventType =
  | "today_visit"
  | "report_open"
  | "report_read"
  | "booking_click";
