import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import {
  getAdminUserDetail,
  recordImpersonateView,
  suspendUser,
  unsuspendUser,
} from "@/lib/admin/platform-service";
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

  const detail = await getAdminUserDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: detail });
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

  const body = (await request.json()) as {
    action?: string;
    reason?: string;
  };

  if (body.action === "suspend") {
    const result = await suspendUser(user.id, id, body.reason ?? "");
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const detail = await getAdminUserDetail(id);
    return NextResponse.json({ ok: true, user: detail });
  }

  if (body.action === "unsuspend") {
    const result = await unsuspendUser(user.id, id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const detail = await getAdminUserDetail(id);
    return NextResponse.json({ ok: true, user: detail });
  }

  if (body.action === "impersonate_view") {
    await recordImpersonateView(user.id, id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}
