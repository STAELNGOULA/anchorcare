import { NextResponse } from "next/server";
import {
  amendIncident,
  getIncidentDetail,
} from "@/lib/incidents/incident-detail-service";
import type { AmendIncidentInput } from "@/lib/incidents/incident-types";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
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

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const detail = await getIncidentDetail(user.id, id);
  if ("error" in detail) {
    const status = detail.error === "not_found" ? 404 : 403;
    return NextResponse.json({ error: detail.error }, { status });
  }

  if (detail.orgId !== orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, detail });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AmendIncidentInput;
  const result = await amendIncident(user.id, id, body);

  if ("error" in result) {
    const status =
      result.error === "window_closed" || result.error === "no_changes"
        ? 422
        : result.error === "forbidden"
          ? 403
          : result.error === "not_found"
            ? 404
            : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const detail = await getIncidentDetail(user.id, id);
  return NextResponse.json({ ok: true, detail });
}
