import { NextResponse } from "next/server";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { listRosterForOrg } from "@/lib/roster/roster-service";
import type { ClearanceStatus } from "@/lib/roster/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const q = searchParams.get("q") ?? undefined;
  const programId = searchParams.get("programId") ?? undefined;
  const clearance = (searchParams.get("clearance") as ClearanceStatus | "all" | null) ?? "all";

  const result = await listRosterForOrg(orgId, {
    page,
    q,
    programId: programId || undefined,
    clearance: clearance === "all" ? "all" : clearance,
  });

  return NextResponse.json(result);
}
