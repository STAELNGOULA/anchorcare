export type InviteType = "parent" | "coach";

export type InviteDetail = {
  id: string;
  token: string;
  inviteType: InviteType;
  email: string | null;
  programName: string;
  childFirstName: string | null;
  orgId: string | null;
  programId: string | null;
  orgName: string | null;
  orgLogoUrl: string | null;
  orgSlug: string | null;
  programStartDate: string | null;
  programEndDate: string | null;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
};

export type InvitePageState =
  | "valid"
  | "expired"
  | "used"
  | "invalid"
  | "wrong_account";

export type ParentChildOption = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  allergies: string | null;
  medications: unknown;
  medicalConditions: string | null;
};

export type AcceptParentInviteInput = {
  token: string;
  childId?: string;
  newChild?: {
    firstName: string;
    lastName?: string;
    dateOfBirth?: string;
  };
  copyHealthProfile?: boolean;
};
