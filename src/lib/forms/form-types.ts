export type ParentFormType =
  | "immunization"
  | "physical"
  | "permission"
  | "custom";

export type ParentFormRecord = {
  id: string;
  title: string;
  formType: ParentFormType;
  childId: string | null;
  childName: string | null;
  programId: string | null;
  programName: string | null;
  expiresAt: string | null;
  fileMime: string | null;
  signedUrl: string | null;
  createdAt: string;
  daysUntilExpiry: number | null;
};

export type ParentFormExpiring = {
  id: string;
  title: string;
  expiresAt: string;
  daysUntil: number;
};

export type CreateParentFormInput = {
  title: string;
  formType: ParentFormType;
  childId?: string | null;
  programId?: string | null;
  expiresAt?: string | null;
};
