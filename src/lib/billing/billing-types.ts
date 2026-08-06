import type { ParentPlan } from "@/lib/parent/parent-context";
import type { SubscriptionSku } from "@/lib/billing/billing-constants";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export type SubscriptionRecord = {
  id: string;
  sku: SubscriptionSku;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
};

export type ParentEntitlements = {
  plan: ParentPlan;
  canAccessFullTimeline: boolean;
  canAccessCare: boolean;
  canAddChild: boolean;
  maxChildren: number;
  subscription: SubscriptionRecord | null;
};

export type OrgEntitlements = {
  trialActive: boolean;
  trialDaysLeft: number;
  proActive: boolean;
  canPublish: boolean;
  canUseVoiceAi: boolean;
  subscription: SubscriptionRecord | null;
};

export type BillingInvoice = {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
};

export type ParentBillingSummary = {
  entitlements: ParentEntitlements;
  stripeConfigured: boolean;
  invoices: BillingInvoice[];
};

export type BusinessBillingSummary = {
  entitlements: OrgEntitlements;
  stripeConfigured: boolean;
  orgName: string;
  invoices: BillingInvoice[];
};
