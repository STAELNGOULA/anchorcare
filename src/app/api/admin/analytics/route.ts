import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import { getAdminAnalytics } from "@/lib/admin/platform-service";
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
  const range = Number(searchParams.get("range") ?? "30");
  const analytics = await getAdminAnalytics(
    Number.isFinite(range) && range > 0 ? range : 30,
  );

  return NextResponse.json({ ok: true, analytics });
}
