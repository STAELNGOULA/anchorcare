import { NextResponse } from "next/server";
import { getParentTodayFeed } from "@/lib/parent/today-service";
import { getParentContext } from "@/lib/parent/parent-context";
import { createClient } from "@/lib/supabase/server";

function deriveDisplayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "Parent";
  }
  const local = email.split("@")[0] ?? "Parent";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const displayName = deriveDisplayName(
    profile.full_name ?? null,
    user.email ?? "",
  );
  const feed = await getParentTodayFeed(user.id, displayName);

  return NextResponse.json({ feed });
}
