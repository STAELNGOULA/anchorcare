import { NextResponse } from "next/server";
import { listCoachThreads } from "@/lib/messaging/messaging-service";
import { getCoachOrgId } from "@/lib/roster/roster-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: assignments } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", user.id);

  const programIds = (assignments ?? []).map((a) => a.program_id);
  if (programIds.length === 0) {
    const orgId = await getCoachOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const threads = await listCoachThreads(user.id, programIds);
  return NextResponse.json({ ok: true, threads });
}
