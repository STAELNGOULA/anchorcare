import { NextResponse } from "next/server";
import {
  createIncident,
  listIncidentsForCoach,
} from "@/lib/incidents/incident-service";
import type { CreateIncidentInput } from "@/lib/incidents/incident-types";
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
  const page = Number(searchParams.get("page") ?? "1");

  const result = await listIncidentsForCoach(user.id, { programId, page });
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let input: CreateIncidentInput;
  let photoFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const payloadRaw = form.get("payload");
    if (typeof payloadRaw !== "string") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    input = JSON.parse(payloadRaw) as CreateIncidentInput;
    photoFiles = form.getAll("photos").filter((f): f is File => f instanceof File);
  } else {
    input = (await request.json()) as CreateIncidentInput;
  }

  const result = await createIncident(user.id, input, photoFiles);
  if ("error" in result) {
    const status =
      result.error === "required_fields" || result.error === "body_area_required"
        ? 422
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, ...result });
}
