import { NextResponse } from "next/server";
import { getOrgRevenueStats } from "@/lib/business/revenue-service";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "30");

  const stats = await getOrgRevenueStats(orgId, days);
  return NextResponse.json({ ok: true, stats });
}
