export const PROGRAM_KIND_VALUES = [
  "camp",
  "class",
  "team",
  "daycare_room",
  "after_school",
  "other",
] as const;

export type ProgramKind = (typeof PROGRAM_KIND_VALUES)[number];

export const PROGRAM_STATUS_VALUES = ["draft", "active", "archived"] as const;
export type ProgramStatus = (typeof PROGRAM_STATUS_VALUES)[number];

export const BILLING_INTERVAL_VALUES = [
  "one_time",
  "monthly",
  "season",
  "weekly",
] as const;

export type BillingInterval = (typeof BILLING_INTERVAL_VALUES)[number];

export const CURRENCY_VALUES = ["USD", "CAD"] as const;
export type ProgramCurrency = (typeof CURRENCY_VALUES)[number];

export type ProgramListItem = {
  id: string;
  name: string;
  programSlug: string;
  status: ProgramStatus;
  programType: ProgramKind;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  priceAmountCents: number;
  currency: ProgramCurrency;
  billingInterval: BillingInterval;
  priceDisplay: string | null;
  publicListingEnabled: boolean;
  enrollmentCount: number;
  stripeConnectOnboarded: boolean;
};

export type Program = ProgramListItem & {
  orgId: string;
  ageMin: number | null;
  ageMax: number | null;
  internalDescription: string | null;
  depositAmountCents: number | null;
  siblingDiscountPercent: number | null;
  priceNote: string | null;
  requirePaymentBeforeApproval: boolean;
  stripePriceId: string | null;
  publicHeadline: string | null;
  publicDescription: string | null;
  heroImageUrl: string | null;
  ageRangeLabel: string | null;
  scheduleSummary: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  waitlistEnabled: boolean;
  featuredOnPage: boolean;
  ctaLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type StripeConnectStatus = {
  accountId: string | null;
  onboarded: boolean;
  chargesEnabled: boolean;
};

export type PublicProgramListing = {
  id: string;
  programSlug: string;
  publicHeadline: string;
  publicDescription: string | null;
  heroImageUrl: string | null;
  ageRangeLabel: string | null;
  scheduleSummary: string | null;
  priceDisplay: string;
  priceAmountCents: number;
  currency: ProgramCurrency;
  billingInterval: BillingInterval;
  priceNote: string | null;
  ctaLabel: string;
  featuredOnPage: boolean;
  spotsRemaining: number | null;
  registrationOpen: boolean;
  waitlistEnabled: boolean;
  paymentsConfigured: boolean;
};
