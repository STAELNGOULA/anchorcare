import { createClient } from "@/lib/supabase/server";

export type ProgramRevenueRow = {
  programId: string;
  programName: string;
  grossCents: number;
  feeCents: number;
  refundCents: number;
};

export type OrgRevenueStats = {
  days: number;
  grossCents: number;
  platformFeeCents: number;
  refundCents: number;
  netCents: number;
  byProgram: ProgramRevenueRow[];
};

export async function getOrgRevenueStats(
  orgId: string,
  days = 30,
): Promise<OrgRevenueStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_revenue_stats", {
    p_org_id: orgId,
    p_days: days,
  });

  if (error || !data || typeof data !== "object") {
    return {
      days,
      grossCents: 0,
      platformFeeCents: 0,
      refundCents: 0,
      netCents: 0,
      byProgram: [],
    };
  }

  const raw = data as Record<string, unknown>;
  const byProgram = Array.isArray(raw.by_program)
    ? (raw.by_program as Record<string, unknown>[]).map((row) => ({
        programId: String(row.program_id ?? ""),
        programName: String(row.program_name ?? "Program"),
        grossCents: Number(row.gross_cents ?? 0),
        feeCents: Number(row.fee_cents ?? 0),
        refundCents: Number(row.refund_cents ?? 0),
      }))
    : [];

  return {
    days: Number(raw.days ?? days),
    grossCents: Number(raw.gross_cents ?? 0),
    platformFeeCents: Number(raw.platform_fee_cents ?? 0),
    refundCents: Number(raw.refund_cents ?? 0),
    netCents: Number(raw.net_cents ?? 0),
    byProgram,
  };
}