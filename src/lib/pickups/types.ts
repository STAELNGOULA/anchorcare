export type AuthorizedPickup = {
  id: string;
  childId: string;
  name: string;
  relation: string;
  phone: string;
  photoSignedUrl: string | null;
  sortOrder: number;
};

export type PickupOverride = {
  id: string;
  childId: string;
  personName: string;
  note: string | null;
  validDate: string;
  untilTime: string | null;
  timezone: string;
  expiresAt: string;
  authorizedPickupId: string | null;
};

export type ParentPickupChild = {
  childId: string;
  firstName: string;
  lastName: string;
  authorized: AuthorizedPickup[];
  todayOverride: PickupOverride | null;
};

export type PickupOverrideSummary = {
  active: boolean;
  personName: string | null;
  note: string | null;
  untilTime: string | null;
  expiresAt: string | null;
};

export type PickupEtaSummary = {
  id: string;
  minutesLate: number;
  note: string | null;
  expectedAt: string;
  programName: string | null;
};
