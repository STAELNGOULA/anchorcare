import type {
  BusinessInviteRow,
  ParentEnrolledProgram,
  RegistrationListItem,
} from "@/lib/registrations/types";
import { buildHealthSnapshot, parseHealthSnapshot } from "@/lib/registrations/health-snapshot";
import { getChildForParent } from "@/lib/parent/children-service";
import { buildCheckoutPricing } from "@/lib/registrations/promo-service";
import { createConnectCheckoutSession } from "@/lib/stripe/checkout";
import { getSiteUrl } from "@/lib/public/json-ld";
import { enqueueJob } from "@/lib/jobs/processor";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PAGE_SIZE = 30;

export async function listRegistrationsForOrg(
  userId: string,
  orgId: string,
  options?: { status?: string; page?: number },
): Promise<{ items: RegistrationListItem[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("program_registrations")
    .select(
      "id, program_id, child_id, parent_id, status, payment_status, registration_source, amount_paid_cents, paid_at, health_snapshot, waiver_accepted_at, created_at, updated_at",
      { count: "exact" },
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status as "pending" | "active" | "withdrawn");
  }

  const { data: rows, count, error } = await query;
  if (error || !rows) return { items: [], total: 0 };

  const programIds = [...new Set(rows.map((r) => r.program_id))];
  const childIds = [...new Set(rows.map((r) => r.child_id))];
  const parentIds = [...new Set(rows.map((r) => r.parent_id))];

  const service = createServiceClient();
  const [{ data: programs }, { data: children }, { data: parents }, { data: org }] =
    await Promise.all([
      service.from("programs").select("id, name").in("id", programIds),
      service.from("children").select("id, first_name, last_name").in("id", childIds),
      service.auth.admin.listUsers({ perPage: 1000 }),
      service.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    ]);

  const parentMap = new Map(
    (parents?.users ?? []).map((p) => [p.id, p.email ?? null]),
  );
  const programMap = new Map((programs ?? []).map((p) => [p.id, p.name]));
  const childMap = new Map((children ?? []).map((c) => [c.id, c]));

  const items: RegistrationListItem[] = rows.map((row) => {
    const child = childMap.get(row.child_id);
    return {
      id: row.id,
      programId: row.program_id,
      programName: programMap.get(row.program_id) ?? "Program",
      orgName: org?.name ?? "",
      childId: row.child_id,
      childFirstName: child?.first_name ?? "",
      childLastName: child?.last_name ?? "",
      parentId: row.parent_id,
      parentEmail: parentMap.get(row.parent_id) ?? null,
      status: row.status as RegistrationListItem["status"],
      paymentStatus: row.payment_status as RegistrationListItem["paymentStatus"],
      registrationSource: row.registration_source as RegistrationListItem["registrationSource"],
      amountPaidCents: row.amount_paid_cents,
      paidAt: row.paid_at,
      waiverSigned: Boolean(row.waiver_accepted_at),
      healthSnapshot: parseHealthSnapshot(row.health_snapshot),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  void userId;
  return { items, total: count ?? 0 };
}

export async function listInvitesForOrg(
  orgId: string,
  page = 1,
): Promise<{ items: BusinessInviteRow[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: rows, count } = await supabase
    .from("invites")
    .select(
      "id, email, program_id, program_name, child_first_name, expires_at, used_at, created_at, token",
      { count: "exact" },
    )
    .eq("org_id", orgId)
    .eq("invite_type", "parent")
    .order("created_at", { ascending: false })
    .range(from, to);

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const items: BusinessInviteRow[] = (rows ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    programId: row.program_id,
    programName: row.program_name,
    childFirstName: row.child_first_name,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
    inviteUrl: row.used_at ? null : `${base}/invite/${row.token}`,
  }));

  return { items, total: count ?? 0 };
}

export async function listEnrolledProgramsForParent(
  parentId: string,
): Promise<ParentEnrolledProgram[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("program_registrations")
    .select(
      "id, program_id, status, payment_status, waiver_accepted_at, programs(name, price_amount_cents, price_display, currency, public_slug), organizations(name)",
    )
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  return (rows ?? []).map((row) => {
    const program = row.programs as unknown as {
      name: string;
      price_amount_cents: number;
      price_display: string | null;
      currency: string;
      public_slug: string | null;
    } | null;
    const org = row.organizations as { name: string } | null;
    const priceCents = program?.price_amount_cents ?? 0;

    return {
      id: row.program_id,
      registrationId: row.id,
      programId: row.program_id,
      programName: program?.name ?? "Program",
      orgName: org?.name ?? "",
      status: row.status as ParentEnrolledProgram["status"],
      paymentStatus: row.payment_status as ParentEnrolledProgram["paymentStatus"],
      needsWaiver: !row.waiver_accepted_at,
      needsPayment: priceCents > 0 && row.payment_status !== "paid",
      amountDueCents: priceCents,
      priceDisplay: program?.price_display ?? null,
    };
  });
}

export async function getRegistrationForParent(
  parentId: string,
  registrationId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("program_registrations")
    .select(
      "*, programs(id, name, price_amount_cents, price_display, currency, program_slug, org_id, sibling_discount_percent, organizations(public_slug, name))",
    )
    .eq("id", registrationId)
    .eq("parent_id", parentId)
    .maybeSingle();

  return data;
}

export async function signRegistrationWaiver(
  userId: string,
  registrationId: string,
  guardianName: string,
  signatureData: string,
) {
  const registration = await getRegistrationForParent(userId, registrationId);
  if (!registration) return { ok: false as const, code: "notFound" };

  const child = await getChildForParent(userId, registration.child_id);
  const healthSnapshot = child ? buildHealthSnapshot(child) : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sign_registration_waiver", {
    p_user_id: userId,
    p_registration_id: registrationId,
    p_guardian_name: guardianName,
    p_signature_data: signatureData,
    p_health_snapshot: healthSnapshot,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("waiver_immutable")) return { ok: false as const, code: "waiverImmutable" };
    if (msg.includes("signature_required")) return { ok: false as const, code: "signatureRequired" };
    return { ok: false as const, code: "signFailed" };
  }

  void data;
  return { ok: true as const };
}

export async function startRegistrationCheckout(
  userId: string,
  input: {
    registrationId: string;
    programId: string;
    orgSlug: string;
    programSlug: string;
    successPath?: string;
    cancelPath?: string;
    promoCode?: string;
    paymentPlan?: "full" | "installment";
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { ok: false as const, code: "unauthorized" };

  const registration = await getRegistrationForParent(userId, input.registrationId);
  if (!registration || registration.program_id !== input.programId) {
    return { ok: false as const, code: "registrationNotFound" };
  }

  const program = registration.programs as unknown as {
    id: string;
    name: string;
    price_amount_cents: number;
    price_display: string | null;
    currency: string;
    org_id: string;
    deposit_amount_cents?: number | null;
    sibling_discount_percent?: number | null;
    installment_count?: number | null;
    public_headline?: string | null;
    organizations: { public_slug: string; name: string } | null;
  };

  if (!program || program.price_amount_cents <= 0) {
    return { ok: false as const, code: "paymentNotRequired" };
  }

  const paymentPlan = input.paymentPlan ?? "full";
  const pricingResult = await buildCheckoutPricing({
    parentId: userId,
    childId: registration.child_id,
    orgId: program.org_id,
    programId: program.id,
    priceAmountCents: program.price_amount_cents,
    depositAmountCents: program.deposit_amount_cents ?? null,
    installmentCount: program.installment_count ?? null,
    siblingDiscountPercent: program.sibling_discount_percent ?? null,
    paymentPlan,
    promoCode: input.promoCode,
    installmentNumber:
      (registration as { payment_plan?: string; installments_paid?: number }).payment_plan ===
      "installment"
        ? ((registration as { installments_paid?: number }).installments_paid ?? 0) + 1
        : 1,
  });

  if (!pricingResult.ok) return { ok: false as const, code: pricingResult.code };

  const { pricing, promoCodeId } = pricingResult;
  const siteUrl = getSiteUrl();
  const successUrl = `${siteUrl}${input.successPath ?? `/parent/programs/enrolled?enrolled=1&registrationId=${input.registrationId}`}`;
  const cancelUrl = `${siteUrl}${input.cancelPath ?? `/parent/programs/enroll/${input.registrationId}?checkout=cancelled`}`;
  const orgSlug = program.organizations?.public_slug ?? input.orgSlug;

  const checkout = await createConnectCheckoutSession({
    registrationId: input.registrationId,
    programId: program.id,
    orgId: program.org_id,
    amountCents: pricing.chargeAmountCents,
    platformFeeCents: pricing.platformFeeCents,
    currency: program.currency,
    productName: program.public_headline ?? program.name,
    parentEmail: user.email,
    successUrl,
    cancelUrl,
    metadata: {
      registration_id: input.registrationId,
      program_id: program.id,
      org_id: program.org_id,
      org_slug: orgSlug,
      program_slug: input.programSlug,
      source: "registration",
      payment_plan: pricing.paymentPlan,
      installment_number: String(pricing.installmentNumber),
      total_due_cents: String(pricing.totalDueCents),
      discount_cents: String(pricing.siblingDiscountCents + pricing.promoDiscountCents),
      platform_fee_cents: String(pricing.platformFeeCents),
      promo_code_id: promoCodeId ?? "",
    },
    paymentPlan: pricing.paymentPlan,
    installmentCount: pricing.installmentCount,
    totalDueCents: pricing.totalDueCents,
    promoCodeId,
    discountCents: pricing.siblingDiscountCents + pricing.promoDiscountCents,
  });

  if (!checkout.ok) return { ok: false as const, code: checkout.code };
  return { ok: true as const, checkoutUrl: checkout.url };
}

export async function approveRegistration(userId: string, registrationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_registration", {
    p_user_id: userId,
    p_registration_id: registrationId,
  });
  if (error) return { ok: false as const, code: "approveFailed" };
  return { ok: true as const };
}

export async function rejectRegistration(
  userId: string,
  registrationId: string,
  reason?: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_registration", {
    p_user_id: userId,
    p_registration_id: registrationId,
    p_reason: reason ?? undefined,
  } as never);
  if (error) return { ok: false as const, code: "rejectFailed" };
  return { ok: true as const };
}

export async function notifyPaidRegistration(registrationId: string) {
  await enqueueJob({
    type: "registration_paid_notify",
    payload: { registrationId },
    idempotencyKey: `registration-paid-${registrationId}`,
  });
  await enqueueJob({
    type: "registration_receipt_email",
    payload: { registrationId },
    idempotencyKey: `registration-receipt-${registrationId}`,
  });
}

export async function getDirectorOrgId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (data?.role !== "business_admin" || !data.org_id) return null;
  return data.org_id;
}

export async function getAdoptionStats(orgId: string) {
  const service = createServiceClient();
  const [{ count: invitesSent }, { count: activeRegs }] = await Promise.all([
    service
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("invite_type", "parent"),
    service
      .from("program_registrations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active"),
  ]);
  return { invitesSent: invitesSent ?? 0, activeRegistrations: activeRegs ?? 0 };
}
