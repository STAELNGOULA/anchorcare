import { NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  getLatestIncidentPdfExport,
  requestIncidentPdfExport,
} from "@/lib/incidents/incident-pdf-service";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await getLatestIncidentPdfExport(user.id, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  const result = await requestIncidentPdfExport(user.id, id);
  if ("error" in result) {
    const status = result.error === "forbidden" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
