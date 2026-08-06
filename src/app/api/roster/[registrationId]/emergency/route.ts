import { NextResponse } from "next/server";
import {
  getStaffEmergencyCard,
  resolveStaffEmergencyScope,
} from "@/lib/emergency/emergency-service";
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

  const scope = await resolveStaffEmergencyScope(user.id, profile.role);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const card = await getStaffEmergencyCard(registrationId, scope);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(card);
}
