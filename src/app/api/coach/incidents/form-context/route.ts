import { NextResponse } from "next/server";
import { getIncidentFormContext } from "@/lib/incidents/incident-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId") ?? undefined;

  const context = await getIncidentFormContext(user.id, programId);
  if ("error" in context) {
    const status = context.error === "no_programs" ? 404 : 403;
    return NextResponse.json({ error: context.error }, { status });
  }

  return NextResponse.json({ ok: true, context });
}
