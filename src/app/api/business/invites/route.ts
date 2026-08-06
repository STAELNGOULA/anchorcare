import { NextResponse } from "next/server";
import {
  getAdoptionStats,
  getDirectorOrgId,
  listInvitesForOrg,
} from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");

  const [{ items, total }, adoption] = await Promise.all([
    listInvitesForOrg(orgId, page),
    getAdoptionStats(orgId),
  ]);

  return NextResponse.json({ ok: true, items, total, adoption });
}
