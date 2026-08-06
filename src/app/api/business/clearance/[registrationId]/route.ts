import { NextResponse } from "next/server";
import { getStaffClearanceSummary } from "@/lib/clearance/clearance-share-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { canCoachAccessRegistration } from "@/lib/roster/roster-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ registrationId: string }> };

async function canAccessClearanceSummary(
  userId: string,
  registrationId: string,
): Promise<boolean> {
  const orgId = await getDirectorOrgId(userId);
  if (orgId) {
    const service = createServiceClient();
    const { data } = await service
      .from("program_registrations")
      .select("org_id")
      .eq("id", registrationId)
      .maybeSingle();
    return data?.org_id === orgId;
  }

  return canCoachAccessRegistration(userId, registrationId);
}

export async function GET(_request: Request, context: RouteContext) {
  const { registrationId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const allowed = await canAccessClearanceSummary(user.id, registrationId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const summary = await getStaffClearanceSummary(registrationId);
  return NextResponse.json({ ok: true, summary });
}
