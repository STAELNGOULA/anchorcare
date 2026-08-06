import type { ClearanceShareStatus } from "@/lib/clearance/clearance-constants";

export type ClearanceEnrollmentOption = {
  registrationId: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  programId: string;
  programName: string;
  orgId: string;
  orgName: string;
};

export type ClearanceShareHistoryItem = {
  id: string;
  registrationId: string;
  programName: string;
  childFirstName: string;
  shareStatus: ClearanceShareStatus;
  summary: string;
  conditions: string | null;
  expiresAt: string | null;
  sharedAt: string;
  isActive: boolean;
  isExpired: boolean;
};

export type CreateClearanceShareInput = {
  registrationId: string;
  shareStatus: ClearanceShareStatus;
  summary: string;
  conditions?: string | null;
  expiresAt?: string | null;
  incidentId?: string | null;
};

export type StaffClearanceSummary = {
  shareStatus: ClearanceShareStatus;
  summary: string;
  conditions: string | null;
  expiresAt: string | null;
  sharedAt: string;
  isExpired: boolean;
};
