import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import { listSlugDisputes } from "@/lib/admin/platform-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "open"
    | "resolved"
    | "rejected"
    | null;

  const disputes = await listSlugDisputes(status ?? undefined);
  return NextResponse.json({ ok: true, disputes });
}
