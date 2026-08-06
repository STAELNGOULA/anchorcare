import { NextResponse } from "next/server";
import { fileSlugDispute } from "@/lib/admin/platform-service";
import { getDirectorContext } from "@/lib/business/director-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getDirectorContext();
  if (!context.orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    disputedSlug?: string;
    reason?: string;
  };

  const result = await fileSlugDispute(
    user.id,
    context.orgId,
    body.disputedSlug ?? "",
    body.reason ?? "",
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, disputeId: result.disputeId });
}
