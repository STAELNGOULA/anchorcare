import { NextResponse } from "next/server";
import { uploadMediaAsset } from "@/lib/reports/media-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ programId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const exifStripped = form.get("exifStripped") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "fileRequired" }, { status: 400 });
  }

  const result = await uploadMediaAsset(
    user.id,
    programId,
    file,
    exifStripped,
  );

  if (!result.ok) {
    const status =
      result.code === "file_invalid"
        ? 400
        : result.code === "upload_failed"
          ? 500
          : 403;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({ ok: true, asset: result.asset });
}
