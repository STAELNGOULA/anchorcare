import { NextResponse } from "next/server";
import {
  discardReportDrafts,
  getReviewWorkspace,
  saveReportDrafts,
  type SaveDraftInput,
} from "@/lib/reports/review-report-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ programId: string }> };

async function requireCoach(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return profile?.role === "coach" || profile?.role === "business_admin";
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

  const result = await getReviewWorkspace(user.id, programId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ workspace: result.workspace });
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const body = (await request.json()) as { updates?: SaveDraftInput[] };
  if (!body.updates?.length) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await saveReportDrafts(user.id, programId, body.updates);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const result = await discardReportDrafts(user.id, programId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
