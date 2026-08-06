import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import {
  listModerationFlags,
  listSlugDisputes,
} from "@/lib/admin/platform-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [flags, slugDisputes] = await Promise.all([
    listModerationFlags(),
    listSlugDisputes("open"),
  ]);

  return NextResponse.json({ ok: true, flags, slugDisputes });
}
