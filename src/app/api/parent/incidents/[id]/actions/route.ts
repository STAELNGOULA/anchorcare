import { NextResponse } from "next/server";
import { recordParentIncidentAction } from "@/lib/incidents/incident-detail-service";
import type { ParentIncidentAction } from "@/lib/incidents/incident-detail-constants";
import { PARENT_INCIDENT_ACTIONS } from "@/lib/incidents/incident-detail-constants";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action?: string };
  const action = body.action as ParentIncidentAction | undefined;

  if (!action || !PARENT_INCIDENT_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const result = await recordParentIncidentAction(user.id, id, action);
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
