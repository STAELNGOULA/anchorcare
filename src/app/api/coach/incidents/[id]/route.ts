import { NextResponse } from "next/server";
import { getIncidentDetail } from "@/lib/incidents/incident-detail-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const detail = await getIncidentDetail(user.id, id);
  if ("error" in detail) {
    const status = detail.error === "not_found" ? 404 : 403;
    return NextResponse.json({ error: detail.error }, { status });
  }

  if (detail.role !== "coach") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, detail });
}
