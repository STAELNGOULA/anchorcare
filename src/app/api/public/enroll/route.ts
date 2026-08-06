import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkCheckoutRateLimit,
  recordCheckoutAttempt,
} from "@/lib/public/checkout-rate-limit";
import { enrollPublicProgram, enrollSchema } from "@/lib/public/enroll-service";
import { recordPublicPageEvent } from "@/lib/public/public-program-service";
import { createPublicCheckoutSession } from "@/lib/stripe/checkout";
import { getSiteUrl } from "@/lib/public/json-ld";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const checkoutSchema = z.object({
  registrationId: z.string().uuid(),
  programId: z.string().uuid(),
  orgSlug: z.string().min(1),
  programSlug: z.string().min(1),
});

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const result = await enrollPublicProgram(user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: program } = await service
    .from("programs")
    .select("org_id")
    .eq("id", parsed.data.programId)
    .maybeSingle();

  if (program?.org_id) {
    void recordPublicPageEvent({
      orgId: program.org_id,
      programId: parsed.data.programId,
      eventType: result.requiresPayment ? "checkout_start" : "checkout_complete",
    });
  }

  return NextResponse.json({
    ok: true,
    registrationId: result.registrationId,
    requiresPayment: result.requiresPayment,
  });
}

export async function PUT(request: Request) {
  const ip = clientIp(request);
  const rate = await checkCheckoutRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rateLimited", retryAfterSeconds: rate.retryAfterSeconds },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: registration } = await service
    .from("program_registrations")
    .select("id, parent_id, program_id")
    .eq("id", parsed.data.registrationId)
    .eq("program_id", parsed.data.programId)
    .eq("parent_id", user.id)
    .maybeSingle();

  if (!registration) {
    return NextResponse.json({ error: "registrationNotFound" }, { status: 404 });
  }

  const { data: program } = await service
    .from("programs")
    .select(
      "id, org_id, name, public_headline, price_amount_cents, currency, deposit_amount_cents",
    )
    .eq("id", parsed.data.programId)
    .maybeSingle();

  if (!program || program.price_amount_cents <= 0) {
    return NextResponse.json({ error: "paymentNotRequired" }, { status: 400 });
  }

  const amountCents =
    program.deposit_amount_cents && program.deposit_amount_cents > 0
      ? program.deposit_amount_cents
      : program.price_amount_cents;

  const siteUrl = getSiteUrl();
  const successUrl = `${siteUrl}/p/${parsed.data.orgSlug}/programs/${parsed.data.programSlug}?enrolled=1`;
  const cancelUrl = `${siteUrl}/p/${parsed.data.orgSlug}/programs/${parsed.data.programSlug}?checkout=cancelled`;

  const checkout = await createPublicCheckoutSession({
    registrationId: parsed.data.registrationId,
    programId: program.id,
    orgId: program.org_id,
    orgSlug: parsed.data.orgSlug,
    programSlug: parsed.data.programSlug,
    amountCents,
    currency: program.currency,
    productName: program.public_headline ?? program.name,
    parentEmail: user.email ?? "",
    successUrl,
    cancelUrl,
  });

  await recordCheckoutAttempt(ip);

  if (!checkout.ok) {
    return NextResponse.json({ error: checkout.code }, { status: 400 });
  }

  void recordPublicPageEvent({
    orgId: program.org_id,
    programId: program.id,
    eventType: "checkout_start",
  });

  return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
}
