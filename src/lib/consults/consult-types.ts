import type { ClearanceShareStatus } from "@/lib/clearance/clearance-constants";

export type ConsultStatus = "pending" | "assigned" | "open" | "closed";
export type ConsultPriority = "normal" | "high";
export type ConsultSenderRole = "parent" | "admin" | "system";

export type ConsultListItem = {
  id: string;
  childId: string;
  childFirstName: string;
  status: ConsultStatus;
  priority: ConsultPriority;
  incidentId: string | null;
  programName: string | null;
  initialMessagePreview: string;
  createdAt: string;
  updatedAt: string;
  waitMinutes: number;
};

export type ConsultMessage = {
  id: string;
  senderRole: ConsultSenderRole;
  senderLabel: string;
  body: string;
  createdAt: string;
};

export type ConsultIncidentContext = {
  id: string;
  incidentType: string;
  severity: string;
  isRedFlag: boolean;
  occurredAt: string;
  mechanism: string | null;
  bodyArea: string | null;
  symptoms: string | null;
  actionTaken: string | null;
};

export type ConsultTimelineSnippet = {
  id: string;
  eventType: string;
  title: string;
  summary: string | null;
  occurredAt: string;
};

export type ConsultDetail = {
  id: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  parentId: string;
  incidentId: string | null;
  programId: string | null;
  programName: string | null;
  orgName: string | null;
  status: ConsultStatus;
  priority: ConsultPriority;
  assignedAdminId: string | null;
  initialMessage: string;
  carePlanSummary: string | null;
  clearanceStatus: ClearanceShareStatus | null;
  clearanceConditions: string | null;
  clearanceExpiresAt: string | null;
  closedAt: string | null;
  createdAt: string;
  incident: ConsultIncidentContext | null;
  timelineSnippets: ConsultTimelineSnippet[];
  messages: ConsultMessage[];
};

export type CreateConsultInput = {
  childId: string;
  incidentId?: string | null;
  programId?: string | null;
  initialMessage: string;
};

export type CloseConsultInput = {
  carePlanSummary: string;
  clearanceStatus: ClearanceShareStatus;
  clearanceConditions?: string | null;
  clearanceExpiresAt?: string | null;
};
