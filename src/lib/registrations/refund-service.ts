import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";

export async function issueRegistrationRefund(
  actorId: string,
  registrationId: string,
  amountCents: number,
  reason?: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (amountCents <= 0) return { ok: false, code: "invalidAmount" };

  const service = createServiceClient();
  const { data: regRaw } = await service
    .from("program_registrations")
    .select(
      "id, amount_paid_cents, refund_cents, stripe_payment_intent_id, payment_status",
    )
    .eq("id", registrationId)
    .maybeSingle();

  const reg = regRaw as {
    amount_paid_cents: number | null;
    refund_cents: number | null;
    stripe_payment_intent_id: string | null;
    payment_status: string;
  } | null;

  if (!reg) return { ok: false, code: "notFound" };
  if (reg.payment_status !== "paid" && reg.payment_status !== "partial") {
    return { ok: false, code: "notRefundable" };
  }

  const paid = reg.amount_paid_cents ?? 0;
  const alreadyRefunded = reg.refund_cents ?? 0;
  const maxRefund = paid - alreadyRefunded;
  if (amountCents > maxRefund) return { ok: false, code: "exceedsPaid" };

  const paymentsTable = service.from("registration_payments" as "organizations");
  const { data: payment } = await paymentsTable
    .select("stripe_payment_intent_id, refund_cents, amount_cents")
    .eq("registration_id" as "id", registrationId)
    .not("stripe_payment_intent_id", "is", null)
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentIntentId =
    (payment as { stripe_payment_intent_id?: string } | null)?.stripe_payment_intent_id ??
    reg.stripe_payment_intent_id;

  if (!paymentIntentId) return { ok: false, code: "noPaymentIntent" };

  const stripe = getStripe();
  if (!stripe) return { ok: false, code: "stripeNotConfigured" };

  let stripeRefundId: string | null = null;
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountCents,
      reason: "requested_by_customer",
      metadata: {
        registration_id: registrationId,
        actor_id: actorId,
      },
    });
    stripeRefundId = refund.id;
  } catch {
    return { ok: false, code: "stripeRefundFailed" };
  }

  const { error } = await service.rpc("record_registration_refund" as "approve_registration", {
    p_registration_id: registrationId,
    p_actor_id: actorId,
    p_refund_cents: amountCents,
    p_stripe_refund_id: stripeRefundId,
    p_reason: reason ?? null,
  } as never);

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("forbidden")) return { ok: false, code: "forbidden" };
    if (msg.includes("refund_exceeds_paid")) return { ok: false, code: "exceedsPaid" };
    if (msg.includes("no_payment")) return { ok: false, code: "notRefundable" };
    return { ok: false, code: "recordFailed" };
  }

  return { ok: true };
}
