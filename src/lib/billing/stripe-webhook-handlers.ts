import { SUBSCRIPTION_SKUS } from "@/lib/billing/billing-constants";
import {
  markSubscriptionCanceled,
  upsertSubscriptionFromStripe,
} from "@/lib/billing/subscription-service";
import type Stripe from "stripe";

export async function handleStripeSubscriptionWebhook(
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) return;

      const stripe = await import("@/lib/stripe/client").then((m) => m.getStripe());
      if (!stripe) return;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      await syncSubscriptionObject(subscription, session.metadata ?? {});
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionObject(subscription, subscription.metadata ?? {});
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await markSubscriptionCanceled(subscription.id);
      break;
    }
    default:
      break;
  }
}

async function syncSubscriptionObject(
  subscription: Stripe.Subscription,
  metadata: Stripe.Metadata,
): Promise<void> {
  const sku =
    metadata.sku === SUBSCRIPTION_SKUS.businessPro
      ? SUBSCRIPTION_SKUS.businessPro
      : SUBSCRIPTION_SKUS.parentFamily;

  const parentId = metadata.parent_id;
  const orgId = metadata.org_id;
  const ownerType =
    metadata.owner_type === "organization" || orgId ? "organization" : "parent";

  if (ownerType === "parent" && !parentId) return;
  if (ownerType === "organization" && !orgId) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  await upsertSubscriptionFromStripe({
    sku,
    ownerType,
    parentId: parentId ?? undefined,
    orgId: orgId ?? undefined,
    stripeCustomerId: customerId,
    stripeSubscription: subscription,
  });
}
