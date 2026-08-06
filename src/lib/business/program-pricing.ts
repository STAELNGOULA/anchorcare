import type { BillingInterval, ProgramCurrency } from "@/lib/business/program-types";

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  one_time: "",
  monthly: "/month",
  season: "/season",
  weekly: "/week",
};

export function formatPriceDisplay(input: {
  amountCents: number;
  currency: ProgramCurrency;
  billingInterval: BillingInterval;
  override?: string | null;
}): string {
  if (input.override?.trim()) return input.override.trim();
  if (input.amountCents <= 0) return "Free";

  const amount = (input.amountCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: input.currency,
    maximumFractionDigits: input.amountCents % 100 === 0 ? 0 : 2,
  });

  return `${amount}${INTERVAL_LABELS[input.billingInterval]}`;
}

export function isPaidProgram(amountCents: number): boolean {
  return amountCents > 0;
}
