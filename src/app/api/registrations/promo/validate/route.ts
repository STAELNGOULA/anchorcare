import { NextResponse } from "next/server";
import { getRegistrationForParent } from "@/lib/registrations/registration-service";
import { validatePromoCode } from "@/lib/registrations/promo-service";
import { computeSiblingDiscountCents } from "@/lib/registrations/pricing-service";
import { promoValidateSchema } from "@/lib/registrations/validation";
import { createClient } from "@/lib/supabase/server";

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

  const parsed = promoValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const registration = await getRegistrationForParent(user.id, parsed.data.registrationId);
  if (!registration || registration.program_id !== parsed.data.programId) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const program = registration.programs;
  if (!program) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const siblingDiscount = computeSiblingDiscountCents(
    program.price_amount_cents,
    program.sibling_discount_percent,
    false,
  );
  const afterSibling = program.price_amount_cents - siblingDiscount;

  const result = await validatePromoCode({
    orgId: program.org_id,
    programId: parsed.data.programId,
    parentId: user.id,
    childId: registration.child_id,
    code: parsed.data.promoCode,
    amountAfterSiblingCents: afterSibling,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    discountCents: result.discountCents,
    code: result.promo.code,
  });
}
