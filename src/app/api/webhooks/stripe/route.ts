import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { handleStripeSubscriptionWebhook } from "@/lib/billing/stripe-webhook-handlers";
import { recordStripeWebhookEvent } from "@/lib/billing/webhook-idempotency";
import { notifyPaidRegistration } from "@/lib/registrations/registration-service";
import { recordPublicPageEvent } from "@/lib/public/public-program-service";
import { verifyStripeWebhook } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missingSignature" }, { status: 400 });
  }

  const event = verifyStripeWebhook(body, signature);
  if (!event) {
    return NextResponse.json({ error: "invalidSignature" }, { status: 400 });
  }

  const record = await recordStripeWebhookEvent({
    stripeEventId: event.id,
    eventType: event.type,
    payload: event,
  });

  if (record === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription") {
      await handleStripeSubscriptionWebhook(event);
      return NextResponse.json({ received: true });
    }

    const amountPaid = session.amount_total ?? 0;
    const meta = session.metadata ?? {};
    const source = meta.source ?? "public";
    const service = createServiceClient();

    if (source === "marketplace") {
      await service.rpc("complete_marketplace_order", {
        p_checkout_session_id: session.id,
        p_amount_paid_cents: amountPaid,
        p_platform_fee_cents: Number(meta.platform_fee_cents ?? 0),
      });
      return NextResponse.json({ received: true });
    }

    const discountCents = Number(meta.discount_cents ?? 0);
    const platformFeeCents = Number(meta.platform_fee_cents ?? 0);
    const paymentPlan = meta.payment_plan ?? "full";
    const installmentNumber = Number(meta.installment_number ?? 1);
    const totalDueCents = meta.total_due_cents ? Number(meta.total_due_cents) : null;
    const promoCodeId = meta.promo_code_id?.trim() ? meta.promo_code_id : null;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    const { data: registrationId } = await service.rpc("complete_checkout_registration", {
      p_checkout_session_id: session.id,
      p_amount_paid_cents: amountPaid,
      p_discount_cents: discountCents,
      p_platform_fee_cents: platformFeeCents,
      p_payment_plan: paymentPlan,
      p_installment_number: installmentNumber,
      p_total_due_cents: totalDueCents,
      p_promo_code_id: promoCodeId,
      p_stripe_payment_intent_id: paymentIntentId,
    });

    const orgSlug = meta.org_slug;
    const programId = meta.program_id;
    const orgId = meta.org_id;

    if (orgSlug) {
      revalidateTag(`org-${orgSlug}`, "max");
    }

    if (orgId && programId) {
      void recordPublicPageEvent({
        orgId,
        programId,
        eventType: "checkout_complete",
      });
    }

    if (!registrationId) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    void notifyPaidRegistration(registrationId as string);
    return NextResponse.json({ received: true });
  }

  if (
    event.type.startsWith("customer.subscription.") ||
    event.type === "invoice.payment_failed"
  ) {
    await handleStripeSubscriptionWebhook(event);
  }

  return NextResponse.json({ received: true });
}
