import { NextResponse } from "next/server";
import { listVisitReportsForParent } from "@/lib/visits/visit-service";
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
  const childId = searchParams.get("childId") ?? undefined;

  const visits = await listVisitReportsForParent(user.id, childId);
  return NextResponse.json({ ok: true, visits });
}
