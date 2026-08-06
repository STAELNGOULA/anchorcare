export type RegistrationStatus = "pending" | "active" | "withdrawn";
export type PaymentStatus =
  | "not_required"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";
export type RegistrationSource = "invite" | "public";

export type HealthSnapshot = {
  allergies: string | null;
  allergyItems: { name: string; severity: string }[];
  medications: { name: string; dose: string; schedule: string }[];
  medicalConditions: string | null;
  emergencyContacts: { name: string; phone: string; relation: string }[];
  physicianName: string | null;
  physicianPhone: string | null;
};

export type RegistrationListItem = {
  id: string;
  programId: string;
  programName: string;
  orgName: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  parentId: string;
  parentEmail: string | null;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  registrationSource: RegistrationSource;
  amountPaidCents: number | null;
  paidAt: string | null;
  waiverSigned: boolean;
  healthSnapshot: HealthSnapshot | null;
  createdAt: string;
  updatedAt: string;
};

export type ParentEnrolledProgram = {
  id: string;
  registrationId: string;
  programId: string;
  programName: string;
  orgName: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  needsWaiver: boolean;
  needsPayment: boolean;
  amountDueCents: number;
  priceDisplay: string | null;
};

export type BusinessInviteRow = {
  id: string;
  email: string | null;
  programId: string | null;
  programName: string;
  childFirstName: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  inviteUrl: string | null;
};
