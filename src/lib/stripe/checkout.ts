import Stripe from "stripe";
import { getOrgStripeConnectStatus } from "@/lib/stripe/connect";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";

export type CheckoutSessionMetadata = {
  registration_id?: string;
  program_id?: string;
  org_id: string;
  org_slug?: string;
  program_slug?: string;
  source: "public" | "registration" | "marketplace";
  payment_plan?: string;
  installment_number?: string;
  total_due_cents?: string;
  discount_cents?: string;
  platform_fee_cents?: string;
  promo_code_id?: string;
  marketplace_order_id?: string;
};

function getStripeClient(): Stripe | null {
  return getStripe();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ordersTable(client: { from: (t: string) => any }) {
  return client.from("marketplace_orders" as "organizations");
}

export async function createConnectCheckoutSession(input: {
  registrationId?: string;
  programId?: string;
  orgId: string;
  amountCents: number;
  platformFeeCents: number;
  currency: string;
  productName: string;
  parentEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: CheckoutSessionMetadata;
  paymentPlan?: "full" | "installment";
  installmentCount?: number | null;
  totalDueCents?: number;
  promoCodeId?: string | null;
  discountCents?: number;
  marketplaceOrderId?: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const stripe = getStripeClient();
  if (!stripe) return { ok: false, code: "stripeNotConfigured" };

  const connect = await getOrgStripeConnectStatus(input.orgId);
  if (!connect.accountId || !connect.chargesEnabled) {
    return { ok: false, code: "connectRequired" };
  }

  const service = createServiceClient();

  if (input.registrationId) {
    const { data: registration } = await service
      .from("program_registrations")
      .select("id, payment_status, stripe_checkout_session_id")
      .eq("id", input.registrationId)
      .maybeSingle();

    if (!registration) return { ok: false, code: "registrationNotFound" };
    if (registration.payment_status === "paid") {
      return { ok: false, code: "alreadyPaid" };
    }
  }

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    transfer_data: { destination: connect.accountId },
  };

  if (input.platformFeeCents > 0) {
    paymentIntentData.application_fee_amount = input.platformFeeCents;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.parentEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountCents,
          product_data: { name: input.productName },
        },
      },
    ],
    payment_intent_data: paymentIntentData,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata as Stripe.MetadataParam,
  });

  if (!session.url) return { ok: false, code: "checkoutFailed" };

  if (input.registrationId) {
    const update = {
      stripe_checkout_session_id: session.id,
      payment_status: "pending" as const,
      updated_at: new Date().toISOString(),
      ...(input.paymentPlan ? { payment_plan: input.paymentPlan } : {}),
      ...(input.installmentCount ? { installment_count: input.installmentCount } : {}),
      ...(input.totalDueCents != null ? { total_due_cents: input.totalDueCents } : {}),
      ...(input.promoCodeId ? { promo_code_id: input.promoCodeId } : {}),
      ...(input.discountCents ? { discount_cents: input.discountCents } : {}),
      ...(input.platformFeeCents ? { platform_fee_cents: input.platformFeeCents } : {}),
    };

    await service
      .from("program_registrations")
      .update(update as never)
      .eq("id", input.registrationId);
  }

  if (input.marketplaceOrderId) {
    await ordersTable(service)
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.marketplaceOrderId);
  }

  return { ok: true, url: session.url };
}

/** @deprecated Use createConnectCheckoutSession */
export async function createPublicCheckoutSession(input: {
  registrationId: string;
  programId: string;
  orgId: string;
  orgSlug: string;
  programSlug: string;
  amountCents: number;
  currency: string;
  productName: string;
  parentEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  return createConnectCheckoutSession({
    registrationId: input.registrationId,
    programId: input.programId,
    orgId: input.orgId,
    amountCents: input.amountCents,
    platformFeeCents: 0,
    currency: input.currency,
    productName: input.productName,
    parentEmail: input.parentEmail,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    metadata: {
      registration_id: input.registrationId,
      program_id: input.programId,
      org_id: input.orgId,
      org_slug: input.orgSlug,
      program_slug: input.programSlug,
      source: "public",
    },
  });
}
