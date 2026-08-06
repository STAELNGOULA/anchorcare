import { NextResponse } from "next/server";
import { startRegistrationCheckout } from "@/lib/registrations/registration-service";
import { checkoutSchema } from "@/lib/registrations/validation";
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

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const result = await startRegistrationCheckout(user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl });
}
