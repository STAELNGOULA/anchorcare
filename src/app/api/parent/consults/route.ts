import { NextResponse } from "next/server";
import {
  createConsult,
  getConsultForParent,
  listConsultsForParent,
  sendConsultMessage,
} from "@/lib/consults/consult-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const consults = await listConsultsForParent(user.id);
  return NextResponse.json({ ok: true, consults });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    childId?: string;
    incidentId?: string;
    programId?: string;
    initialMessage?: string;
  };

  const result = await createConsult(user.id, {
    childId: body.childId ?? "",
    incidentId: body.incidentId ?? null,
    programId: body.programId ?? null,
    initialMessage: body.initialMessage ?? "",
  });

  if (!result.ok) {
    const status =
      result.error === "family_plan_required"
        ? 402
        : result.error === "child_not_linked"
          ? 422
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, consultId: result.consultId });
}
