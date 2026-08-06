import {
  canEnablePublicListing,
  type ProgramCreateInput,
  type ProgramPatchInput,
} from "@/lib/business/program-validation";
import { formatPriceDisplay } from "@/lib/business/program-pricing";
import {
  computeSpotsRemaining,
  isRegistrationWindowOpen,
} from "@/lib/business/program-public";
import type {
  BillingInterval,
  Program,
  ProgramCurrency,
  ProgramKind,
  ProgramListItem,
  ProgramStatus,
  PublicProgramListing,
} from "@/lib/business/program-types";
import {
  getDirectorOrgId,
  isDirectorOfOrg,
} from "@/lib/business/org-profile-service";
import { getOrgStripeConnectStatus } from "@/lib/stripe/connect";
import { slugifyOrgName } from "@/lib/business/slug";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/supabase";

type ProgramsUpdate = Database["public"]["Tables"]["programs"]["Update"];

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
  status: ProgramStatus;
  internal_description: string | null;
  price_amount_cents: number;
  currency: ProgramCurrency;
  billing_interval: BillingInterval;
  deposit_amount_cents: number | null;
  sibling_discount_percent: number | null;
  price_display: string | null;
  price_note: string | null;
  require_payment_before_approval: boolean;
  stripe_price_id: string | null;
  public_listing_enabled: boolean;
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
  created_at: string;
  updated_at: string;
};

async function getEnrollmentCounts(
  programIds: string[],
): Promise<Record<string, number>> {
  if (programIds.length === 0) return {};
  const service = createServiceClient();
  const { data } = await service
    .from("program_registrations")
    .select("program_id")
    .in("program_id", programIds)
    .eq("status", "active");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.program_id] = (counts[row.program_id] ?? 0) + 1;
  }
  return counts;
}

function mapProgramRow(
  row: ProgramRow,
  enrollmentCount: number,
  stripeConnectOnboarded: boolean,
): Program {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    programSlug: row.program_slug,
    programType: row.program_type,
    ageMin: row.age_min,
    ageMax: row.age_max,
    startDate: row.start_date,
    endDate: row.end_date,
    capacity: row.capacity,
    status: row.status,
    internalDescription: row.internal_description,
    priceAmountCents: row.price_amount_cents,
    currency: row.currency,
    billingInterval: row.billing_interval,
    depositAmountCents: row.deposit_amount_cents,
    siblingDiscountPercent: row.sibling_discount_percent,
    priceDisplay:
      row.price_display ??
      formatPriceDisplay({
        amountCents: row.price_amount_cents,
        currency: row.currency,
        billingInterval: row.billing_interval,
      }),
    priceNote: row.price_note,
    requirePaymentBeforeApproval: row.require_payment_before_approval,
    stripePriceId: row.stripe_price_id,
    publicListingEnabled: row.public_listing_enabled,
    publicHeadline: row.public_headline,
    publicDescription: row.public_description,
    heroImageUrl: row.hero_image_url,
    ageRangeLabel: row.age_range_label,
    scheduleSummary: row.schedule_summary,
    registrationOpensAt: row.registration_opens_at,
    registrationClosesAt: row.registration_closes_at,
    waitlistEnabled: row.waitlist_enabled,
    featuredOnPage: row.featured_on_page,
    ctaLabel: row.cta_label,
    enrollmentCount,
    stripeConnectOnboarded,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapListItem(program: Program): ProgramListItem {
  const { createdAt: _c, updatedAt: _u, orgId: _o, ...rest } = program;
  return rest;
}

export async function listProgramsForDirector(
  userId: string,
  options?: { status?: ProgramStatus | "all"; page?: number; pageSize?: number },
): Promise<{ programs: ProgramListItem[]; total: number } | null> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId || !(await isDirectorOfOrg(userId, orgId))) return null;

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("programs")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("start_date", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, count, error } = await query;
  if (error || !data) return { programs: [], total: 0 };

  const connect = await getOrgStripeConnectStatus(orgId);
  const enrollmentCounts = await getEnrollmentCounts(data.map((r) => r.id));

  const programs = (data as ProgramRow[]).map((row) =>
    mapListItem(
      mapProgramRow(row, enrollmentCounts[row.id] ?? 0, connect.onboarded),
    ),
  );

  return { programs, total: count ?? programs.length };
}

export async function getProgramForDirector(
  userId: string,
  programId: string,
): Promise<Program | null> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId || !(await isDirectorOfOrg(userId, orgId))) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!data) return null;

  const connect = await getOrgStripeConnectStatus(orgId);
  const enrollmentCounts = await getEnrollmentCounts([programId]);
  return mapProgramRow(
    data as ProgramRow,
    enrollmentCounts[programId] ?? 0,
    connect.onboarded,
  );
}

async function resolveUniqueProgramSlug(
  orgId: string,
  name: string,
  preferred?: string,
): Promise<string> {
  const base =
    preferred?.trim() && /^[a-z0-9-]{3,40}$/.test(preferred.trim())
      ? preferred.trim()
      : slugifyOrgName(name);

  let slug = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await assertSlugAvailable(orgId, slug)) return slug;
    slug = `${base.slice(0, 34)}-${attempt + 1}`;
  }

  return `${base.slice(0, 30)}-${Date.now().toString(36).slice(-6)}`;
}

async function assertSlugAvailable(
  orgId: string,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const service = createServiceClient();
  let query = service
    .from("programs")
    .select("id")
    .eq("org_id", orgId)
    .eq("program_slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  return !data;
}

function buildInsertRow(orgId: string, input: ProgramCreateInput & { programSlug: string }) {
  return {
    org_id: orgId,
    name: input.name,
    program_slug: input.programSlug,
    program_type: input.programType ?? "other",
    age_min: input.ageMin ?? null,
    age_max: input.ageMax ?? null,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    capacity: input.capacity ?? null,
    internal_description: input.internalDescription ?? null,
    price_amount_cents: input.priceAmountCents,
    currency: input.currency,
    billing_interval: input.billingInterval,
    deposit_amount_cents: input.depositAmountCents ?? null,
    sibling_discount_percent: input.siblingDiscountPercent ?? null,
    price_display: input.priceDisplay ?? null,
    price_note: input.priceNote ?? null,
    require_payment_before_approval: input.requirePaymentBeforeApproval ?? true,
    public_listing_enabled: input.publicListingEnabled ?? false,
    public_headline: input.publicHeadline ?? null,
    public_description: input.publicDescription ?? null,
    hero_image_url: input.heroImageUrl ?? null,
    age_range_label: input.ageRangeLabel ?? null,
    schedule_summary: input.scheduleSummary ?? null,
    registration_opens_at: input.registrationOpensAt ?? null,
    registration_closes_at: input.registrationClosesAt ?? null,
    waitlist_enabled: input.waitlistEnabled ?? false,
    featured_on_page: input.featuredOnPage ?? false,
    cta_label: input.ctaLabel ?? "Book & pay",
    status: input.status ?? "draft",
    updated_at: new Date().toISOString(),
  };
}

export async function createProgram(
  userId: string,
  input: ProgramCreateInput,
): Promise<
  | { ok: true; program: Program }
  | { ok: false; code: string; fieldErrors?: Record<string, string> }
> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId || !(await isDirectorOfOrg(userId, orgId))) {
    return { ok: false, code: "forbidden" };
  }

  const connect = await getOrgStripeConnectStatus(orgId);
  if (input.publicListingEnabled) {
    const gate = canEnablePublicListing({
      priceAmountCents: input.priceAmountCents,
      stripeConnectOnboarded: connect.onboarded,
      publicHeadline: input.publicHeadline ?? input.name,
      scheduleSummary: input.scheduleSummary ?? null,
    });
    if (!gate.ok) return { ok: false, code: gate.reason ?? "listingBlocked" };
  }

  const programSlug = await resolveUniqueProgramSlug(
    orgId,
    input.name,
    input.programSlug,
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert(buildInsertRow(orgId, { ...input, programSlug }))
    .select("*")
    .single();

  if (error || !data) return { ok: false, code: "saveFailed" };

  return {
    ok: true,
    program: mapProgramRow(data as ProgramRow, 0, connect.onboarded),
  };
}

export async function updateProgram(
  userId: string,
  programId: string,
  patch: ProgramPatchInput,
): Promise<
  | { ok: true; program: Program }
  | { ok: false; code: string; fieldErrors?: Record<string, string> }
> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId || !(await isDirectorOfOrg(userId, orgId))) {
    return { ok: false, code: "forbidden" };
  }

  const current = await getProgramForDirector(userId, programId);
  if (!current) return { ok: false, code: "notFound" };

  const connect = await getOrgStripeConnectStatus(orgId);
  const nextPrice = patch.priceAmountCents ?? current.priceAmountCents;
  const nextListing =
    patch.publicListingEnabled ?? current.publicListingEnabled;
  const nextHeadline = patch.publicHeadline ?? current.publicHeadline;
  const nextSchedule = patch.scheduleSummary ?? current.scheduleSummary;

  if (nextListing) {
    const gate = canEnablePublicListing({
      priceAmountCents: nextPrice,
      stripeConnectOnboarded: connect.onboarded,
      publicHeadline: nextHeadline,
      scheduleSummary: nextSchedule,
    });
    if (!gate.ok) return { ok: false, code: gate.reason ?? "listingBlocked" };
  }

  if (patch.programSlug && patch.programSlug !== current.programSlug) {
    if (!(await assertSlugAvailable(orgId, patch.programSlug, programId))) {
      return { ok: false, code: "slugTaken", fieldErrors: { programSlug: "slugTaken" } };
    }
  }

  const update: ProgramsUpdate = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.programSlug !== undefined) update.program_slug = patch.programSlug;
  if (patch.programType !== undefined) update.program_type = patch.programType;
  if (patch.ageMin !== undefined) update.age_min = patch.ageMin;
  if (patch.ageMax !== undefined) update.age_max = patch.ageMax;
  if (patch.startDate !== undefined) update.start_date = patch.startDate;
  if (patch.endDate !== undefined) update.end_date = patch.endDate;
  if (patch.capacity !== undefined) update.capacity = patch.capacity;
  if (patch.internalDescription !== undefined)
    update.internal_description = patch.internalDescription;
  if (patch.priceAmountCents !== undefined)
    update.price_amount_cents = patch.priceAmountCents;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.billingInterval !== undefined)
    update.billing_interval = patch.billingInterval;
  if (patch.depositAmountCents !== undefined)
    update.deposit_amount_cents = patch.depositAmountCents;
  if (patch.siblingDiscountPercent !== undefined)
    update.sibling_discount_percent = patch.siblingDiscountPercent;
  if (patch.priceDisplay !== undefined) update.price_display = patch.priceDisplay;
  if (patch.priceNote !== undefined) update.price_note = patch.priceNote;
  if (patch.requirePaymentBeforeApproval !== undefined)
    update.require_payment_before_approval = patch.requirePaymentBeforeApproval;
  if (patch.publicListingEnabled !== undefined)
    update.public_listing_enabled = patch.publicListingEnabled;
  if (patch.publicHeadline !== undefined) update.public_headline = patch.publicHeadline;
  if (patch.publicDescription !== undefined)
    update.public_description = patch.publicDescription;
  if (patch.heroImageUrl !== undefined) update.hero_image_url = patch.heroImageUrl;
  if (patch.ageRangeLabel !== undefined) update.age_range_label = patch.ageRangeLabel;
  if (patch.scheduleSummary !== undefined)
    update.schedule_summary = patch.scheduleSummary;
  if (patch.registrationOpensAt !== undefined)
    update.registration_opens_at = patch.registrationOpensAt;
  if (patch.registrationClosesAt !== undefined)
    update.registration_closes_at = patch.registrationClosesAt;
  if (patch.waitlistEnabled !== undefined) update.waitlist_enabled = patch.waitlistEnabled;
  if (patch.featuredOnPage !== undefined) update.featured_on_page = patch.featuredOnPage;
  if (patch.ctaLabel !== undefined) update.cta_label = patch.ctaLabel;
  if (patch.status !== undefined) update.status = patch.status;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .update(update)
    .eq("id", programId)
    .eq("org_id", orgId)
    .select("*")
    .single();

  if (error || !data) return { ok: false, code: "saveFailed" };

  const enrollmentCounts = await getEnrollmentCounts([programId]);
  return {
    ok: true,
    program: mapProgramRow(
      data as ProgramRow,
      enrollmentCounts[programId] ?? 0,
      connect.onboarded,
    ),
  };
}

export async function archiveProgram(
  userId: string,
  programId: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const result = await updateProgram(userId, programId, { status: "archived" });
  if (!result.ok) return result;
  return { ok: true };
}

export async function listPublicProgramsForOrg(
  orgId: string,
  paymentsConfigured = false,
): Promise<PublicProgramListing[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("programs")
    .select("*")
    .eq("org_id", orgId)
    .eq("public_listing_enabled", true)
    .eq("status", "active")
    .order("featured_on_page", { ascending: false })
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error || !data?.length) return [];

  const enrollmentCounts = await getEnrollmentCounts(data.map((row) => row.id));

  return (data as ProgramRow[]).map((row) => {
    const enrollment = enrollmentCounts[row.id] ?? 0;
    return {
      id: row.id,
      programSlug: row.program_slug,
      publicHeadline: row.public_headline ?? row.name,
      publicDescription: row.public_description,
      heroImageUrl: row.hero_image_url,
      ageRangeLabel: row.age_range_label,
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
      spotsRemaining: computeSpotsRemaining(row.capacity, enrollment),
      registrationOpen: isRegistrationWindowOpen(
        row.registration_opens_at,
        row.registration_closes_at,
      ),
      waitlistEnabled: row.waitlist_enabled,
      paymentsConfigured,
    };
  });
}
