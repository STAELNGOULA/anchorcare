import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import { resolveSlugDispute } from "@/lib/admin/platform-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

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
    action?: "grant" | "reject" | "reassign";
    grantedSlug?: string;
    resolutionNotes?: string;
  };

  if (!body.action) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await resolveSlugDispute(user.id, id, {
    action: body.action,
    grantedSlug: body.grantedSlug,
    resolutionNotes: body.resolutionNotes,
  });

  if (!result.ok) {
    const status = result.error === "slug_taken" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
