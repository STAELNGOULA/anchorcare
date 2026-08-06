import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import { PDF_BUCKET } from "@/lib/visits/visit-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const childId = form.get("childId")?.toString();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "fileRequired" }, { status: 400 });
  }

  if (!childId) {
    return NextResponse.json({ error: "childRequired" }, { status: 400 });
  }

  if (file.type !== "application/pdf" || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "fileInvalid" }, { status: 400 });
  }

  const path = `${childId}/${Date.now()}.pdf`;
  const service = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from(PDF_BUCKET)
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "uploadFailed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
