import { NextResponse } from "next/server";
import { issueRegistrationRefund } from "@/lib/registrations/refund-service";
import { refundSchema } from "@/lib/registrations/validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: registrationId } = await context.params;
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

  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const result = await issueRegistrationRefund(
    user.id,
    registrationId,
    parsed.data.amountCents,
    parsed.data.reason,
  );

  if (!result.ok) {
    const status =
      result.code === "forbidden"
        ? 403
        : result.code === "notFound"
          ? 404
          : 400;
    return NextResponse.json({ error: result.code }, { status });
  }

  return NextResponse.json({ ok: true });
}
