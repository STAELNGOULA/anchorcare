import { NextResponse } from "next/server";
import { getParentTimelinePage } from "@/lib/parent/timeline-service";
import type { TimelineFilter } from "@/lib/parent/timeline-constants";
import { createClient } from "@/lib/supabase/server";

const VALID_FILTERS = new Set<TimelineFilter>([
  "all",
  "reports",
  "photos",
  "incidents",
  "care",
]);

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  const filterParam = url.searchParams.get("filter") ?? "all";
  const cursor = url.searchParams.get("cursor");
  const filter = VALID_FILTERS.has(filterParam as TimelineFilter)
    ? (filterParam as TimelineFilter)
    : "all";

  const page = await getParentTimelinePage(user.id, "free", {
    childId: childId || null,
    filter,
    cursor,
  });

  return NextResponse.json({ page });
}
