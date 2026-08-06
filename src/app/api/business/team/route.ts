import { NextResponse } from "next/server";
import {
  listPendingCoachInvites,
  listTeamMembers,
  listTeamPrograms,
} from "@/lib/business/team-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  const [members, pendingInvites, programs] = await Promise.all([
    listTeamMembers(orgId),
    listPendingCoachInvites(orgId),
    listTeamPrograms(orgId),
  ]);

  return NextResponse.json({ ok: true, members, pendingInvites, programs });
}
