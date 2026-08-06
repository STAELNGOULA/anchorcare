import { NextResponse } from "next/server";
import { updateTeamMember } from "@/lib/business/team-service";
import type { UpdateTeamMemberInput } from "@/lib/business/team-types";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { userId: memberUserId } = await context.params;
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

  const body = (await request.json()) as UpdateTeamMemberInput;
  const result = await updateTeamMember(user.id, orgId, memberUserId, body);

  if ("error" in result) {
    const status =
      result.error === "forbidden" ? 403 : result.error === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
