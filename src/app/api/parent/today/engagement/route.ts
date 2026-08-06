import { NextResponse } from "next/server";
import { recordParentEngagement } from "@/lib/parent/today-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    eventType?: "today_visit" | "report_open" | "report_read";
    childId?: string;
    timelineEventId?: string;
  };

  const eventType = body.eventType ?? "today_visit";

  if (
    eventType !== "today_visit" &&
    eventType !== "report_open" &&
    eventType !== "report_read" &&
    eventType !== "booking_click"
  ) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const metadata = (body as { metadata?: Record<string, unknown> }).metadata;

  await recordParentEngagement(user.id, eventType, {
    childId: body.childId,
    timelineEventId: body.timelineEventId,
    metadata: metadata ?? { source: "parent_today" },
  });

  return NextResponse.json({ ok: true });
}
