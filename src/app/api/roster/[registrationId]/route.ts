import { NextResponse } from "next/server";
import {
  canCoachAccessRegistration,
  getCoachOrgId,
  getRosterChildDetail,
} from "@/lib/roster/roster-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ registrationId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { registrationId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let detail = null;

  if (profile.role === "business_admin") {
    const orgId = await getDirectorOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    detail = await getRosterChildDetail(registrationId, { type: "org", orgId });
  } else if (profile.role === "coach") {
    const orgId = await getCoachOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const allowed = await canCoachAccessRegistration(user.id, registrationId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    detail = await getRosterChildDetail(registrationId, {
      type: "coach",
      userId: user.id,
      orgId,
    });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
