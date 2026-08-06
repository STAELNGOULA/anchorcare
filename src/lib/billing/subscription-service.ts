import {
  SUBSCRIPTION_SKUS,
  type SubscriptionSku,
} from "@/lib/billing/billing-constants";
import type { SubscriptionStatus } from "@/lib/billing/billing-types";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subscriptionsTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("subscriptions" as "profiles");
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "unpaid":
      return "unpaid";
    default:
      return "canceled";
  }
}

export async function upsertSubscriptionFromStripe(input: {
  sku: SubscriptionSku;
  ownerType: "parent" | "organization";
  parentId?: string;
  orgId?: string;
  stripeCustomerId: string | null;
  stripeSubscription: Stripe.Subscription;
}): Promise<void> {
  const service = createServiceClient();
  const sub = input.stripeSubscription;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const periodEnd =
    (sub as Stripe.Subscription & { current_period_end?: number })
      .current_period_end ?? null;

  const row = {
    sku: input.sku,
    owner_type: input.ownerType,
    parent_id: input.parentId ?? null,
    org_id: input.orgId ?? null,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    status: mapStripeStatus(sub.status),
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const conflictKey =
    input.ownerType === "parent"
      ? { onConflict: "parent_id,sku" }
      : { onConflict: "org_id,sku" };

  await subscriptionsTable(service).upsert(row, conflictKey);
}

export async function markSubscriptionCanceled(
  stripeSubscriptionId: string,
): Promise<void> {
  const service = createServiceClient();
  await subscriptionsTable(service)
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);
}

export async function getStripeCustomerIdForParent(
  parentId: string,
): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await subscriptionsTable(service)
    .select("stripe_customer_id")
    .eq("parent_id", parentId)
    .eq("sku", SUBSCRIPTION_SKUS.parentFamily)
    .maybeSingle();

  return data?.stripe_customer_id ?? null;
}

export async function getStripeCustomerIdForOrg(
  orgId: string,
): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await subscriptionsTable(service)
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .eq("sku", SUBSCRIPTION_SKUS.businessPro)
    .maybeSingle();

  return data?.stripe_customer_id ?? null;
}

export async function saveStripeCustomerId(input: {
  sku: SubscriptionSku;
  parentId?: string;
  orgId?: string;
  stripeCustomerId: string;
}): Promise<void> {
  const service = createServiceClient();
  const row = {
    sku: input.sku,
    owner_type: input.parentId ? "parent" : "organization",
    parent_id: input.parentId ?? null,
    org_id: input.orgId ?? null,
    stripe_customer_id: input.stripeCustomerId,
    status: "incomplete",
    updated_at: new Date().toISOString(),
  };

  if (input.parentId) {
    await subscriptionsTable(service).upsert(row, {
      onConflict: "parent_id,sku",
    });
    return;
  }

  if (input.orgId) {
    await subscriptionsTable(service).upsert(row, {
      onConflict: "org_id,sku",
    });
  }
}
