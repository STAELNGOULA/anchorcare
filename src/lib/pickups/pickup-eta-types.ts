export type PickupEtaSummary = {
  id: string;
  childId: string;
  minutesLate: number;
  note: string | null;
  expectedAt: string;
  programId: string | null;
  programName: string | null;
};

export type SetPickupEtaInput = {
  childId: string;
  minutesLate: number;
  note?: string | null;
};
