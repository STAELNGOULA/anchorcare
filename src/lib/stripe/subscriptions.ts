import { SUBSCRIPTION_SKUS } from "@/lib/billing/billing-constants";
import {
  getStripeCustomerIdForOrg,
  getStripeCustomerIdForParent,
  saveStripeCustomerId,
} from "@/lib/billing/subscription-service";
import {
  getBusinessProPriceId,
  getParentFamilyPriceId,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe/client";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function createParentFamilyCheckout(input: {
  parentId: string;
  email: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const stripe = getStripe();
  const priceId = getParentFamilyPriceId();
  if (!stripe || !priceId) return { ok: false, code: "stripeNotConfigured" };

  let customerId = await getStripeCustomerIdForParent(input.parentId);
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.email,
      metadata: { parent_id: input.parentId, sku: SUBSCRIPTION_SKUS.parentFamily },
    });
    customerId = customer.id;
    await saveStripeCustomerId({
      sku: SUBSCRIPTION_SKUS.parentFamily,
      parentId: input.parentId,
      stripeCustomerId: customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/parent/you/subscription?checkout=success`,
    cancel_url: `${APP_URL}/parent/you/subscription?checkout=cancel`,
    metadata: {
      sku: SUBSCRIPTION_SKUS.parentFamily,
      parent_id: input.parentId,
      owner_type: "parent",
    },
    subscription_data: {
      metadata: {
        sku: SUBSCRIPTION_SKUS.parentFamily,
        parent_id: input.parentId,
        owner_type: "parent",
      },
    },
  });

  if (!session.url) return { ok: false, code: "checkoutFailed" };
  return { ok: true, url: session.url };
}

export async function createBusinessProCheckout(input: {
  orgId: string;
  email: string;
  orgName: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const stripe = getStripe();
  const priceId = getBusinessProPriceId();
  if (!stripe || !priceId) return { ok: false, code: "stripeNotConfigured" };

  let customerId = await getStripeCustomerIdForOrg(input.orgId);
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.email,
      name: input.orgName,
      metadata: { org_id: input.orgId, sku: SUBSCRIPTION_SKUS.businessPro },
    });
    customerId = customer.id;
    await saveStripeCustomerId({
      sku: SUBSCRIPTION_SKUS.businessPro,
      orgId: input.orgId,
      stripeCustomerId: customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/business/settings/billing?checkout=success`,
    cancel_url: `${APP_URL}/business/settings/billing?checkout=cancel`,
    metadata: {
      sku: SUBSCRIPTION_SKUS.businessPro,
      org_id: input.orgId,
      owner_type: "organization",
    },
    subscription_data: {
      metadata: {
        sku: SUBSCRIPTION_SKUS.businessPro,
        org_id: input.orgId,
        owner_type: "organization",
      },
    },
  });

  if (!session.url) return { ok: false, code: "checkoutFailed" };
  return { ok: true, url: session.url };
}

export async function createBillingPortalSession(input: {
  customerId: string;
  returnPath: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return { ok: false, code: "stripeNotConfigured" };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${APP_URL}${input.returnPath}`,
  });

  return { ok: true, url: session.url };
}

export { isStripeConfigured };
