import type { IncidentSeverity } from "@/lib/incidents/incident-constants";

export type IncidentWitness = {
  name: string;
  role: string;
};

export type IncidentListItem = {
  id: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  programId: string;
  programName: string;
  incidentType: string;
  severity: IncidentSeverity;
  isRedFlag: boolean;
  occurredAt: string;
  location: string | null;
  status: string;
  parentNotifiedAt: string | null;
  notificationStagedAt: string | null;
  reportedByName: string | null;
};

export type IncidentRosterChild = {
  childId: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  photoSignedUrl: string | null;
  allergies: { name: string; severity: string }[];
  programId: string;
  programName: string;
};

export type IncidentFormContext = {
  orgId: string;
  orgType: string | null;
  programs: { id: string; name: string }[];
  children: IncidentRosterChild[];
};

export type CreateIncidentInput = {
  programId: string;
  childId: string;
  incidentType: string;
  occurredAt: string;
  location: string;
  mechanism: string;
  bodyArea?: string | null;
  symptoms: string;
  painLevel?: number | null;
  actionTaken: string;
  witnesses: IncidentWitness[];
};

export type CreateIncidentResult = {
  incidentId: string;
  isRedFlag: boolean;
  parentNotifiedStagedAt: string;
};

export type IncidentAuditDiff = {
  field: string;
  labelKey: string;
  before: string;
  after: string;
};

export type IncidentAuditEntry = {
  id: string;
  action: string;
  actorId: string | null;
  actorLabel: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
  diff: IncidentAuditDiff[];
};

export type IncidentPhotoItem = {
  id: string;
  signedUrl: string;
};

export type IncidentDetailRole = "parent" | "coach" | "director";

export type IncidentDetail = {
  id: string;
  orgId: string;
  programId: string;
  programName: string;
  orgName: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  incidentType: string;
  severity: IncidentSeverity;
  isRedFlag: boolean;
  occurredAt: string;
  location: string | null;
  mechanism: string | null;
  bodyArea: string | null;
  symptoms: string | null;
  painLevel: number | null;
  actionTaken: string | null;
  witnesses: IncidentWitness[];
  status: string;
  parentNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  photos: IncidentPhotoItem[];
  auditTrail: IncidentAuditEntry[];
  role: IncidentDetailRole;
  canAmend: boolean;
  amendDeadline: string | null;
};

export type AmendIncidentInput = {
  location?: string;
  mechanism?: string;
  bodyArea?: string | null;
  symptoms?: string;
  painLevel?: number | null;
  actionTaken?: string;
  witnesses?: IncidentWitness[];
  amendReason: string;
};
