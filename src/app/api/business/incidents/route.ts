import { NextResponse } from "next/server";
import { listIncidentsForOrg } from "@/lib/incidents/incident-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
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

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") ?? undefined;
  const programId = searchParams.get("programId") ?? undefined;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");

  const result = await listIncidentsForOrg(orgId, {
    severity,
    programId,
    fromDate,
    toDate,
    page,
  });

  return NextResponse.json({ ok: true, ...result });
}
