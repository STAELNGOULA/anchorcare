import type { BillingInvoice, BusinessBillingSummary, ParentBillingSummary } from "@/lib/billing/billing-types";
import { getOrgEntitlements, getParentEntitlements } from "@/lib/billing/entitlements";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

function mapInvoice(inv: Stripe.Invoice): BillingInvoice {
  return {
    id: inv.id ?? "",
    number: inv.number,
    status: inv.status,
    amountDue: inv.amount_due ?? 0,
    currency: inv.currency ?? "usd",
    created: inv.created,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    pdfUrl: inv.invoice_pdf ?? null,
  };
}

async function listInvoicesForCustomer(
  customerId: string | null,
): Promise<BillingInvoice[]> {
  if (!customerId) return [];
  const stripe = getStripe();
  if (!stripe) return [];

  const { data } = await stripe.invoices.list({
    customer: customerId,
    limit: 12,
  });

  return data.map(mapInvoice);
}

export async function getParentBillingSummary(
  parentId: string,
  childrenCount: number,
): Promise<ParentBillingSummary> {
  const entitlements = await getParentEntitlements(parentId, childrenCount);
  const invoices = await listInvoicesForCustomer(
    entitlements.subscription?.stripeCustomerId ?? null,
  );

  return {
    entitlements,
    stripeConfigured: isStripeConfigured(),
    invoices,
  };
}

export async function getBusinessBillingSummary(
  orgId: string,
): Promise<BusinessBillingSummary> {
  const service = createServiceClient();
  const { data: org } = await service
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const entitlements = await getOrgEntitlements(orgId);
  const invoices = await listInvoicesForCustomer(
    entitlements.subscription?.stripeCustomerId ?? null,
  );

  return {
    entitlements,
    stripeConfigured: isStripeConfigured(),
    orgName: org?.name ?? "Your organization",
    invoices,
  };
}
