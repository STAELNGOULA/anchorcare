import { NextResponse } from "next/server";
import { publishTaggedMedia } from "@/lib/reports/media-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ programId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await publishTaggedMedia(user.id, programId);
  if (!result.ok) {
    const status = result.code === "untagged_media" ? 422 : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    publishedCount: result.publishedCount,
    familiesNotified: result.familiesNotified,
  });
}
