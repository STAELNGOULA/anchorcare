import type { CheckoutPricingResult } from "@/lib/registrations/pricing-service";
import {
  computeCheckoutPricing,
  computePromoDiscountCents,
} from "@/lib/registrations/pricing-service";
import { createServiceClient } from "@/lib/supabase/service";

export type PromoCodeRecord = {
  id: string;
  orgId: string;
  programId: string | null;
  code: string;
  discountType: "percent" | "fixed_cents";
  discountValue: number;
  siblingOnly: boolean;
  maxUses: number | null;
  usesCount: number;
  active: boolean;
  expiresAt: string | null;
};

export type PromoCodeListItem = PromoCodeRecord & {
  programName: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function promoTable(client: { from: (table: string) => any }): any {
  return client.from("registration_promo_codes" as "organizations");
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function countSiblingEnrollments(
  parentId: string,
  orgId: string,
  excludeChildId?: string,
): Promise<number> {
  const service = createServiceClient();
  let query = service
    .from("program_registrations")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId)
    .eq("org_id", orgId)
    .in("status", ["active", "pending"]);

  if (excludeChildId) {
    query = query.neq("child_id", excludeChildId);
  }

  const { count } = await query;
  return count ?? 0;
}

export async function validatePromoCode(input: {
  orgId: string;
  programId: string;
  parentId: string;
  childId: string;
  code: string;
  amountAfterSiblingCents: number;
}): Promise<
  | { ok: true; promo: PromoCodeRecord; discountCents: number }
  | { ok: false; code: string }
> {
  const normalized = normalizeCode(input.code);
  if (!normalized) return { ok: false, code: "invalidCode" };

  const service = createServiceClient();
  const { data } = await promoTable(service)
    .select(
      "id, org_id, program_id, code, discount_type, discount_value, sibling_only, max_uses, uses_count, active, expires_at",
    )
    .eq("org_id", input.orgId)
    .eq("code", normalized)
    .maybeSingle();

  if (!data || !data.active) return { ok: false, code: "invalidCode" };

  if (data.program_id && data.program_id !== input.programId) {
    return { ok: false, code: "invalidCode" };
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, code: "expired" };
  }

  if (data.max_uses != null && data.uses_count >= data.max_uses) {
    return { ok: false, code: "maxUses" };
  }

  const siblingCount = await countSiblingEnrollments(
    input.parentId,
    input.orgId,
    input.childId,
  );

  if (data.sibling_only && siblingCount === 0) {
    return { ok: false, code: "siblingRequired" };
  }

  const discountCents = computePromoDiscountCents(
    input.amountAfterSiblingCents,
    data.discount_type as "percent" | "fixed_cents",
    data.discount_value,
  );

  if (discountCents <= 0) return { ok: false, code: "invalidCode" };

  return {
    ok: true,
    promo: {
      id: data.id,
      orgId: data.org_id,
      programId: data.program_id,
      code: data.code,
      discountType: data.discount_type as "percent" | "fixed_cents",
      discountValue: data.discount_value,
      siblingOnly: Boolean(data.sibling_only),
      maxUses: data.max_uses,
      usesCount: data.uses_count,
      active: Boolean(data.active),
      expiresAt: data.expires_at,
    },
    discountCents,
  };
}

export async function buildCheckoutPricing(input: {
  parentId: string;
  childId: string;
  orgId: string;
  programId: string;
  priceAmountCents: number;
  depositAmountCents: number | null;
  installmentCount: number | null;
  siblingDiscountPercent: number | null;
  paymentPlan: "full" | "installment";
  promoCode?: string;
  installmentNumber?: number;
}): Promise<
  | { ok: true; pricing: CheckoutPricingResult; promoCodeId: string | null }
  | { ok: false; code: string }
> {
  const siblingCount = await countSiblingEnrollments(
    input.parentId,
    input.orgId,
    input.childId,
  );

  const basePricing = computeCheckoutPricing(
    {
      priceAmountCents: input.priceAmountCents,
      depositAmountCents: input.depositAmountCents,
      installmentCount: input.installmentCount,
      siblingDiscountPercent: input.siblingDiscountPercent,
      paymentPlan: input.paymentPlan,
    },
    {
      hasSiblingEnrollment: siblingCount > 0,
      installmentNumber: input.installmentNumber,
    },
  );

  let promoCodeId: string | null = null;
  let promoDiscountCents = 0;

  if (input.promoCode?.trim()) {
    const afterSibling =
      input.priceAmountCents - basePricing.siblingDiscountCents;
    const promo = await validatePromoCode({
      orgId: input.orgId,
      programId: input.programId,
      parentId: input.parentId,
      childId: input.childId,
      code: input.promoCode,
      amountAfterSiblingCents: afterSibling,
    });
    if (!promo.ok) return { ok: false, code: promo.code };
    promoCodeId = promo.promo.id;
    promoDiscountCents = promo.discountCents;
  }

  const pricing = computeCheckoutPricing(
    {
      priceAmountCents: input.priceAmountCents,
      depositAmountCents: input.depositAmountCents,
      installmentCount: input.installmentCount,
      siblingDiscountPercent: input.siblingDiscountPercent,
      paymentPlan: input.paymentPlan,
    },
    {
      hasSiblingEnrollment: siblingCount > 0,
      promoDiscountCents,
      installmentNumber: input.installmentNumber,
    },
  );

  return { ok: true, pricing, promoCodeId };
}

export async function listPromoCodesForOrg(orgId: string): Promise<PromoCodeListItem[]> {
  const service = createServiceClient();
  const { data } = await promoTable(service)
    .select(
      "id, org_id, program_id, code, discount_type, discount_value, sibling_only, max_uses, uses_count, active, expires_at, programs(name)",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: {
    id: string;
    org_id: string;
    program_id: string | null;
    code: string;
    discount_type: string;
    discount_value: number;
    sibling_only: boolean;
    max_uses: number | null;
    uses_count: number;
    active: boolean;
    expires_at: string | null;
    programs: { name: string } | null;
  }) => ({
    id: row.id,
    orgId: row.org_id,
    programId: row.program_id,
    code: row.code,
    discountType: row.discount_type as "percent" | "fixed_cents",
    discountValue: row.discount_value,
    siblingOnly: Boolean(row.sibling_only),
    maxUses: row.max_uses,
    usesCount: row.uses_count,
    active: Boolean(row.active),
    expiresAt: row.expires_at,
    programName: row.programs?.name ?? null,
  }));
}

export async function createPromoCode(
  orgId: string,
  input: {
    code: string;
    programId?: string | null;
    discountType: "percent" | "fixed_cents";
    discountValue: number;
    siblingOnly?: boolean;
    maxUses?: number | null;
    expiresAt?: string | null;
  },
): Promise<PromoCodeRecord | { error: string }> {
  const code = normalizeCode(input.code);
  if (!code) return { error: "invalid_code" };

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await promoTable(service)
    .insert({
      org_id: orgId,
      program_id: input.programId ?? null,
      code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      sibling_only: Boolean(input.siblingOnly),
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
      active: true,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id, org_id, program_id, code, discount_type, discount_value, sibling_only, max_uses, uses_count, active, expires_at",
    )
    .single();

  if (error || !data) return { error: "save_failed" };

  return {
    id: data.id,
    orgId: data.org_id,
    programId: data.program_id,
    code: data.code,
    discountType: data.discount_type as "percent" | "fixed_cents",
    discountValue: data.discount_value,
    siblingOnly: Boolean(data.sibling_only),
    maxUses: data.max_uses,
    usesCount: data.uses_count,
    active: Boolean(data.active),
    expiresAt: data.expires_at,
  };
}

export async function updatePromoCode(
  orgId: string,
  promoId: string,
  patch: { active?: boolean; maxUses?: number | null },
): Promise<boolean> {
  const service = createServiceClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.active !== undefined) update.active = patch.active;
  if (patch.maxUses !== undefined) update.max_uses = patch.maxUses;

  const { error } = await promoTable(service)
    .update(update)
    .eq("id", promoId)
    .eq("org_id", orgId);

  return !error;
}
