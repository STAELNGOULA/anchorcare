import { NextResponse } from "next/server";
import { inviteCoach } from "@/lib/business/team-service";
import type { CreateCoachInviteInput } from "@/lib/business/team-types";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateCoachInviteInput;
  const result = await inviteCoach(user.id, orgId, body);

  if ("error" in result) {
    const status = result.error === "forbidden" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, ...result });
}
