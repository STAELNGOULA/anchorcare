import { NextResponse } from "next/server";
import { getMediaWorkspace } from "@/lib/reports/media-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ programId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await getMediaWorkspace(user.id, programId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ workspace: result.workspace });
}
