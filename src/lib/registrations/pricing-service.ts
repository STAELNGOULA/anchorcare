export const DEFAULT_PLATFORM_FEE_PERCENT = Number(
  process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "0",
);

export function calculatePlatformFeeCents(amountCents: number): number {
  if (!DEFAULT_PLATFORM_FEE_PERCENT || amountCents <= 0) return 0;
  return Math.round((amountCents * DEFAULT_PLATFORM_FEE_PERCENT) / 100);
}

export type PaymentPlanMode = "full" | "installment";

export type CheckoutPricingInput = {
  priceAmountCents: number;
  depositAmountCents: number | null;
  installmentCount: number | null;
  siblingDiscountPercent: number | null;
  paymentPlan: PaymentPlanMode;
};

export type CheckoutPricingResult = {
  baseAmountCents: number;
  siblingDiscountCents: number;
  promoDiscountCents: number;
  totalDueCents: number;
  chargeAmountCents: number;
  platformFeeCents: number;
  paymentPlan: PaymentPlanMode;
  installmentCount: number | null;
  installmentNumber: number;
};

export function computeSiblingDiscountCents(
  baseAmountCents: number,
  siblingDiscountPercent: number | null,
  hasSiblingEnrollment: boolean,
): number {
  if (!hasSiblingEnrollment || !siblingDiscountPercent || siblingDiscountPercent <= 0) {
    return 0;
  }
  return Math.min(
    baseAmountCents,
    Math.round((baseAmountCents * siblingDiscountPercent) / 100),
  );
}

export function computePromoDiscountCents(
  amountAfterSiblingCents: number,
  discountType: "percent" | "fixed_cents",
  discountValue: number,
): number {
  if (amountAfterSiblingCents <= 0) return 0;
  if (discountType === "percent") {
    return Math.min(
      amountAfterSiblingCents,
      Math.round((amountAfterSiblingCents * discountValue) / 100),
    );
  }
  return Math.min(amountAfterSiblingCents, discountValue);
}

export function computeCheckoutPricing(
  input: CheckoutPricingInput,
  options?: {
    promoDiscountCents?: number;
    hasSiblingEnrollment?: boolean;
    installmentNumber?: number;
  },
): CheckoutPricingResult {
  const baseAmountCents = Math.max(0, input.priceAmountCents);
  const siblingDiscountCents = computeSiblingDiscountCents(
    baseAmountCents,
    input.siblingDiscountPercent,
    options?.hasSiblingEnrollment ?? false,
  );
  const afterSibling = baseAmountCents - siblingDiscountCents;
  const promoDiscountCents = Math.min(
    afterSibling,
    options?.promoDiscountCents ?? 0,
  );
  const totalDueCents = Math.max(0, afterSibling - promoDiscountCents);

  const installmentCount =
    input.paymentPlan === "installment" && input.installmentCount && input.installmentCount > 1
      ? input.installmentCount
      : null;

  let chargeAmountCents = totalDueCents;

  if (installmentCount) {
    chargeAmountCents = Math.ceil(totalDueCents / installmentCount);
  } else if (input.depositAmountCents && input.depositAmountCents > 0) {
    chargeAmountCents = Math.min(input.depositAmountCents, totalDueCents);
  }

  const platformFeeCents = calculatePlatformFeeCents(chargeAmountCents);

  return {
    baseAmountCents,
    siblingDiscountCents,
    promoDiscountCents,
    totalDueCents,
    chargeAmountCents,
    platformFeeCents,
    paymentPlan: input.paymentPlan,
    installmentCount,
    installmentNumber: options?.installmentNumber ?? 1,
  };
}
