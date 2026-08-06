export type AllergySeverity = "mild" | "moderate" | "severe";

export type AllergyItem = {
  name: string;
  severity: AllergySeverity;
};

export type ChildMedication = {
  id?: string;
  name: string;
  dose: string;
  schedule: string;
};

export type EmergencyContact = {
  id?: string;
  name: string;
  phone: string;
  relation: string;
};

export type ChildProgramEnrollment = {
  id: string;
  programId: string;
  programName: string;
  status: "pending" | "active" | "withdrawn";
  orgName: string;
};

export type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  photoUrl: string | null;
  photoSignedUrl: string | null;
  allergies: string | null;
  allergyItems: AllergyItem[];
  medicalConditions: string | null;
  physicianName: string | null;
  physicianPhone: string | null;
  insuranceInfo: string | null;
  medications: ChildMedication[];
  emergencyContacts: EmergencyContact[];
  programCount: number;
  programs: ChildProgramEnrollment[];
  healthScore: number;
  createdAt: string;
  updatedAt: string;
};

export type ChildListItem = Pick<
  ChildProfile,
  | "id"
  | "firstName"
  | "lastName"
  | "dateOfBirth"
  | "photoSignedUrl"
  | "programCount"
  | "healthScore"
>;
