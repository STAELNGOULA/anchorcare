import type { ProgramListItem } from "@/lib/business/program-types";
import { formatPriceDisplay } from "@/lib/business/program-pricing";
import type {
  BillingInterval,
  ProgramCurrency,
  ProgramKind,
  ProgramStatus,
} from "@/lib/business/program-types";
import { createClient } from "@/lib/supabase/server";

type ProgramRow = {
  id: string;
  name: string;
  program_slug: string;
  program_type: ProgramKind;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  status: ProgramStatus;
  price_amount_cents: number;
  currency: ProgramCurrency;
  billing_interval: BillingInterval;
  price_display: string | null;
  public_listing_enabled: boolean;
};

export async function listProgramsForCoach(
  userId: string,
): Promise<ProgramListItem[]> {
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId);

  const programIds = (assignments ?? []).map((a) => a.program_id);
  if (programIds.length === 0) return [];

  const { data: programs } = await supabase
    .from("programs")
    .select(
      "id, name, program_slug, program_type, start_date, end_date, capacity, status, price_amount_cents, currency, billing_interval, price_display, public_listing_enabled",
    )
    .in("id", programIds)
    .neq("status", "archived");

  if (!programs) return [];

  const { data: registrations } = await supabase
    .from("program_registrations")
    .select("program_id")
    .in("program_id", programIds)
    .eq("status", "active");

  const enrollmentCounts: Record<string, number> = {};
  for (const row of registrations ?? []) {
    enrollmentCounts[row.program_id] = (enrollmentCounts[row.program_id] ?? 0) + 1;
  }

  return (programs as ProgramRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    programSlug: row.program_slug,
    programType: row.program_type,
    startDate: row.start_date,
    endDate: row.end_date,
    capacity: row.capacity,
    status: row.status,
    priceAmountCents: row.price_amount_cents,
    currency: row.currency,
    billingInterval: row.billing_interval,
    priceDisplay:
      row.price_display ??
      formatPriceDisplay({
        amountCents: row.price_amount_cents,
        currency: row.currency,
        billingInterval: row.billing_interval,
      }),
    publicListingEnabled: row.public_listing_enabled,
    enrollmentCount: enrollmentCounts[row.id] ?? 0,
    stripeConnectOnboarded: true,
  }));
}

export async function countCoachPrograms(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("program_coaches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}
