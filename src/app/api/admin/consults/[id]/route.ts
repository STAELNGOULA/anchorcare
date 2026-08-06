import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import {
  assignConsult,
  closeConsult,
  getConsultForAdmin,
  sendConsultMessage,
} from "@/lib/consults/consult-service";
import type { ClearanceShareStatus } from "@/lib/clearance/clearance-constants";
import { CLEARANCE_SHARE_STATUSES } from "@/lib/clearance/clearance-constants";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const consult = await getConsultForAdmin(id);
  if (!consult) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, consult });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (body.action === "assign") {
    const result = await assignConsult(user.id, id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    const consult = await getConsultForAdmin(id);
    return NextResponse.json({ ok: true, consult });
  }

  if (body.action === "close") {
    const status = body.clearanceStatus as ClearanceShareStatus;
    if (!(CLEARANCE_SHARE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "invalid_clearance" }, { status: 400 });
    }
    const result = await closeConsult(user.id, id, {
      carePlanSummary: body.carePlanSummary ?? "",
      clearanceStatus: status,
      clearanceConditions: body.clearanceConditions ?? null,
      clearanceExpiresAt: body.clearanceExpiresAt ?? null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const consult = await getConsultForAdmin(id);
    return NextResponse.json({ ok: true, consult });
  }

  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { message?: string };
  const result = await sendConsultMessage(user.id, id, body.message ?? "", "admin");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
