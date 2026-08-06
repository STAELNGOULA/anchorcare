import { NextResponse } from "next/server";
import {
  getDirectorOrgId,
  isDirectorOfOrg,
} from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId || !(await isDirectorOfOrg(user.id, orgId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind")?.toString() ?? "logo";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "fileRequired" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "fileInvalid" }, { status: 400 });
  }

  const bucket = kind === "cover" || kind === "gallery" ? "org-media" : "org-logos";
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${orgId}/${kind}-${Date.now()}.${ext}`;

  const service = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "uploadFailed" }, { status: 500 });
  }

  const { data: urlData } = service.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ ok: true, url: urlData.publicUrl, path });
}
