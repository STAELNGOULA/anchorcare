import { NextResponse } from "next/server";
import { uploadChildPhoto } from "@/lib/parent/children-service";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "fileRequired" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "fileInvalid" }, { status: 400 });
  }

  const result = await uploadChildPhoto(user.id, id, file);
  if (!result.ok) {
    const status = result.code === "notFound" ? 404 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    photoPath: result.photoPath,
    signedUrl: result.signedUrl,
  });
}
