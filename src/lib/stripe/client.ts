import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getParentFamilyPriceId(): string | null {
  return process.env.STRIPE_PRICE_PARENT_FAMILY_MONTHLY ?? null;
}

export function getBusinessProPriceId(): string | null {
  return process.env.STRIPE_PRICE_BUSINESS_PRO_MONTHLY ?? null;
}

export function verifyStripeWebhook(
  payload: string,
  signature: string,
): Stripe.Event | null {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return null;
  }
}
