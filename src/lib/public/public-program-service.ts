import { formatPriceDisplay } from "@/lib/business/program-pricing";
import {
  computeSpotsRemaining,
  isRegistrationWindowOpen,
} from "@/lib/business/program-public";
import type {
  BillingInterval,
  ProgramCurrency,
  ProgramKind,
  PublicProgramListing,
} from "@/lib/business/program-types";
import { getPublicOrgBySlug } from "@/lib/business/org-profile-service";
import { getOrgStripeConnectStatus } from "@/lib/stripe/connect";
import { createServiceClient } from "@/lib/supabase/service";

export type PublicProgramDetail = PublicProgramListing & {
  orgId: string;
  orgSlug: string;
  orgName: string;
  programType: ProgramKind;
  ageMin: number | null;
  ageMax: number | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  billingInterval: BillingInterval;
  priceAmountCents: number;
  currency: ProgramCurrency;
  paymentsConfigured: boolean;
  requirePaymentBeforeApproval: boolean;
};

type ProgramRow = {
  id: string;
  org_id: string;
  name: string;
  program_slug: string;
  program_type: ProgramKind;
  age_min: number | null;
  age_max: number | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  price_amount_cents: number;
  currency: ProgramCurrency;
  billing_interval: BillingInterval;
  price_display: string | null;
  price_note: string | null;
  public_headline: string | null;
  public_description: string | null;
  hero_image_url: string | null;
  age_range_label: string | null;
  schedule_summary: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  waitlist_enabled: boolean;
  featured_on_page: boolean;
  cta_label: string;
  require_payment_before_approval: boolean;
  status: string;
  public_listing_enabled: boolean;
};

async function getEnrollmentCount(programId: string): Promise<number> {
  const service = createServiceClient();
  const { count } = await service
    .from("program_registrations")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .in("status", ["pending", "active"]);
  return count ?? 0;
}

function mapProgramRow(
  row: ProgramRow,
  orgSlug: string,
  orgName: string,
  enrollment: number,
  paymentsConfigured: boolean,
): PublicProgramDetail {
  const registrationOpen = isRegistrationWindowOpen(
    row.registration_opens_at,
    row.registration_closes_at,
  );
  const spotsRemaining = computeSpotsRemaining(row.capacity, enrollment);

  return {
    id: row.id,
    orgId: row.org_id,
    orgSlug,
    orgName,
    programSlug: row.program_slug,
    programType: row.program_type,
    publicHeadline: row.public_headline ?? row.name,
    publicDescription: row.public_description,
    heroImageUrl: row.hero_image_url,
    ageRangeLabel: row.age_range_label,
    ageMin: row.age_min,
    ageMax: row.age_max,
    startDate: row.start_date,
    endDate: row.end_date,
    capacity: row.capacity,
    scheduleSummary: row.schedule_summary,
    priceDisplay:
      row.price_display ??
      formatPriceDisplay({
        amountCents: row.price_amount_cents,
        currency: row.currency,
        billingInterval: row.billing_interval,
      }),
    priceNote: row.price_note,
    priceAmountCents: row.price_amount_cents,
    currency: row.currency,
    billingInterval: row.billing_interval,
    ctaLabel: row.cta_label,
    featuredOnPage: row.featured_on_page,
    spotsRemaining,
    registrationOpen,
    waitlistEnabled: row.waitlist_enabled,
    paymentsConfigured,
    requirePaymentBeforeApproval: row.require_payment_before_approval,
  };
}

export async function getPublicProgramBySlug(
  orgSlug: string,
  programSlug: string,
  options?: { preview?: boolean; userId?: string },
): Promise<PublicProgramDetail | null> {
  const org = await getPublicOrgBySlug(orgSlug, options);
  if (!org) return null;

  const connect = await getOrgStripeConnectStatus(org.id);
  const paymentsConfigured =
    connect.onboarded && connect.chargesEnabled;

  const service = createServiceClient();
  let query = service
    .from("programs")
    .select("*")
    .eq("org_id", org.id)
    .eq("program_slug", programSlug);

  if (!options?.preview) {
    query = query.eq("public_listing_enabled", true).eq("status", "active");
  }

  const { data } = await query.maybeSingle();
  if (!data) {
    if (!options?.preview || !options.userId) return null;
    return null;
  }

  const row = data as ProgramRow;
  if (options?.preview && (!row.public_listing_enabled || row.status !== "active")) {
    const { isDirectorOfOrg } = await import("@/lib/business/org-profile-service");
    const allowed = await isDirectorOfOrg(options.userId!, org.id);
    if (!allowed) return null;
  }

  const enrollment = await getEnrollmentCount(row.id);
  return mapProgramRow(row, org.publicSlug, org.name, enrollment, paymentsConfigured);
}

export async function recordPublicPageEvent(input: {
  orgId: string;
  programId?: string;
  eventType: "view" | "program_click" | "checkout_start" | "checkout_complete";
}): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const service = createServiceClient();
  await service.from("public_page_events").insert({
    org_id: input.orgId,
    program_id: input.programId ?? null,
    event_type: input.eventType,
  });
}
