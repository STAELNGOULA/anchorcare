export type PickupEtaRosterSummary = {
  active: boolean;
  minutesLate: number | null;
  note: string | null;
  expectedAt: string | null;
};

export function pickupEtaFromRosterRow(row: {
  pickup_eta_active?: boolean;
  pickup_eta_minutes?: number | null;
  pickup_eta_note?: string | null;
  pickup_eta_expected_at?: string | null;
}): PickupEtaRosterSummary | null {
  if (!row.pickup_eta_active || !row.pickup_eta_expected_at) return null;
  return {
    active: true,
    minutesLate: row.pickup_eta_minutes ?? null,
    note: row.pickup_eta_note ?? null,
    expectedAt: row.pickup_eta_expected_at,
  };
}
