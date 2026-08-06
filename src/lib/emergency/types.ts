import type { AllergyItem, ChildMedication, EmergencyContact } from "@/lib/parent/child-types";

export type EmergencyConsents = {
  sharePhotos: boolean;
  shareAllergies: boolean;
  shareMeds: boolean;
  shareContacts: boolean;
};

export type ProgramEmergencyConsent = EmergencyConsents & {
  registrationId: string;
  programId: string;
  programName: string;
  orgName: string;
  status: "pending" | "active" | "withdrawn";
};

export type ParentEmergencyChild = {
  childId: string;
  firstName: string;
  lastName: string;
  allergies: string | null;
  allergyItems: AllergyItem[];
  medicalConditions: string | null;
  physicianName: string | null;
  physicianPhone: string | null;
  medications: ChildMedication[];
  emergencyContacts: EmergencyContact[];
  programs: ProgramEmergencyConsent[];
};

export type StaffEmergencyCard = {
  registrationId: string;
  childId: string;
  firstName: string;
  lastName: string;
  programName: string;
  consents: EmergencyConsents;
  allergies: string | null;
  allergyItems: AllergyItem[];
  medicalConditions: string | null;
  medications: ChildMedication[];
  emergencyContacts: EmergencyContact[];
  physicianName: string | null;
  physicianPhone: string | null;
  updatedAt: string;
  withheld: {
    allergies: boolean;
    meds: boolean;
    contacts: boolean;
  };
};

export type StaffEmergencyNavItem = {
  registrationId: string;
  firstName: string;
  lastName: string;
};
