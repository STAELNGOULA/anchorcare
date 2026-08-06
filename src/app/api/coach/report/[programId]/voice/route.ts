import { NextResponse } from "next/server";
import {
  assertCoachProgramAccess,
  getTodayVoiceDraft,
  uploadVoiceRecording,
} from "@/lib/reports/voice-report-service";
import type { ReportScope } from "@/lib/reports/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ programId: string }> };

async function requireCoach(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "coach" && profile?.role !== "business_admin") {
    return false;
  }
  return true;
}

export async function GET(_request: Request, context: RouteContext) {
  const { programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireCoach(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const access = await assertCoachProgramAccess(user.id, programId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const draft = await getTodayVoiceDraft(programId);
  return NextResponse.json({ draft, programName: access.programName });
}

export async function POST(request: Request, context: RouteContext) {
  const { programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireCoach(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("audio");
  const durationMs = Number(form.get("durationMs"));
  const scope = (form.get("scope") as ReportScope | null) ?? "group";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (scope !== "group" && scope !== "per_child") {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const result = await uploadVoiceRecording({
    userId: user.id,
    programId,
    file,
    durationMs,
    scope,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ draft: result.draft });
}
