import type { AllergyItem } from "@/lib/parent/child-types";
import type { MorningHealthRosterSummary } from "@/lib/health/health-check-roster";
import type { PickupEtaRosterSummary } from "@/lib/pickups/pickup-eta-roster";
import type { PickupOverrideSummary } from "@/lib/pickups/types";

export type ClearanceStatus = "cleared" | "pending" | "hold";

export type RosterListItem = {
  registrationId: string;
  orgId: string;
  programId: string;
  programName: string;
  childId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  photoSignedUrl: string | null;
  allergies: string | null;
  allergyItems: AllergyItem[];
  medicalConditions: string | null;
  registrationStatus: "pending" | "active" | "withdrawn";
  clearanceStatus: ClearanceStatus;
  pickupOverrideToday: boolean;
  pickupOverride: PickupOverrideSummary | null;
  pickupEta: PickupEtaRosterSummary | null;
  morningHealth: MorningHealthRosterSummary | null;
  groupName: string | null;
  enrolledAt: string;
};

export type RosterChildDetail = RosterListItem & {
  parentId: string;
  parentEmail: string | null;
  staffNotes: string | null;
  medications: { name: string; dose: string; schedule: string }[];
  emergencyContacts: { name: string; phone: string; relation: string }[];
  physicianName: string | null;
  physicianPhone: string | null;
  insuranceInfo: string | null;
};

export type RosterFilters = {
  q?: string;
  programId?: string;
  clearance?: ClearanceStatus | "all";
  page?: number;
};

export type RosterListResult = {
  items: RosterListItem[];
  total: number;
  programs: { id: string; name: string }[];
};
