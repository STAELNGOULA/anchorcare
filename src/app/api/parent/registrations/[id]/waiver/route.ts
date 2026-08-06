import { NextResponse } from "next/server";
import { signRegistrationWaiver } from "@/lib/registrations/registration-service";
import { waiverSignSchema } from "@/lib/registrations/validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  const parsed = waiverSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const result = await signRegistrationWaiver(
    user.id,
    id,
    parsed.data.guardianName,
    parsed.data.signatureData,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
