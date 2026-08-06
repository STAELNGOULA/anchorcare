import { NextResponse } from "next/server";
import {
  approveRegistration,
  getDirectorOrgId,
  rejectRegistration,
} from "@/lib/registrations/registration-service";
import { rejectRegistrationSchema } from "@/lib/registrations/validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: registration } = await supabase
    .from("program_registrations")
    .select("id")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!registration) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const action =
    typeof body === "object" && body !== null && "action" in body
      ? String((body as { action: string }).action)
      : "";

  if (action === "approve") {
    const result = await approveRegistration(user.id, id);
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const parsed = rejectRegistrationSchema.safeParse(body);
    const reason = parsed.success ? parsed.data.reason : undefined;
    const result = await rejectRegistration(user.id, id, reason);
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalidAction" }, { status: 400 });
}
