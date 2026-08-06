import { NextResponse } from "next/server";
import { listProgramsForCoach } from "@/lib/coach/program-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  if (profile?.role !== "coach" && profile?.role !== "business_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (profile.role === "business_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const programs = await listProgramsForCoach(user.id);
  return NextResponse.json({ ok: true, programs });
}

export async function POST() {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}
