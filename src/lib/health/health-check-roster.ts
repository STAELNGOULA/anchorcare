import type { HealthCheckStatus } from "@/lib/health/health-check-types";

export type MorningHealthRosterSummary = {
  status: HealthCheckStatus;
  note: string | null;
};

export function morningHealthFromRosterRow(row: {
  morning_health_status?: string | null;
  morning_health_note?: string | null;
}): MorningHealthRosterSummary | null {
  const status = row.morning_health_status;
  if (!status) return null;
  if (
    status !== "healthy" &&
    status !== "mild_symptoms" &&
    status !== "staying_home"
  ) {
    return null;
  }
  return {
    status,
    note: row.morning_health_note ?? null,
  };
}
