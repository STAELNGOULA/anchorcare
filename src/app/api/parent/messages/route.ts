import { NextResponse } from "next/server";
import {
  listParentThreads,
  resolveParentThreadFromContext,
} from "@/lib/messaging/messaging-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const programId = url.searchParams.get("program");
  const childId = url.searchParams.get("childId") ?? undefined;

  if (programId) {
    const threadId = await resolveParentThreadFromContext(user.id, programId, childId);
    if (threadId) {
      return NextResponse.json({ ok: true, threadId, redirect: `/parent/messages/${threadId}` });
    }
  }

  const threads = await listParentThreads(user.id);
  return NextResponse.json({ ok: true, threads });
}
