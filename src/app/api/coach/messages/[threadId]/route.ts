import { NextResponse } from "next/server";
import {
  getThreadForStaff,
  getThreadMessages,
  sendStaffMessage,
} from "@/lib/messaging/messaging-service";
import type { MessageItem } from "@/lib/messaging/messaging-types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { threadId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const thread = await getThreadForStaff(user.id, threadId);
  if ("error" in thread) {
    const status = thread.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: thread.error }, { status });
  }

  const result = await getThreadMessages(user.id, threadId, "staff");
  if ("error" in result) {
    const status = result.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, thread, messages: result.messages });
}

export async function POST(request: Request, context: RouteContext) {
  const { threadId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { body?: string };
  const result = await sendStaffMessage(user.id, threadId, {
    body: body.body ?? "",
  });

  if ("error" in result) {
    const status =
      result.error === "invalid_body"
        ? 422
        : result.error === "forbidden"
          ? 403
          : result.error === "not_found"
            ? 404
            : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const refreshed = await getThreadMessages(user.id, threadId, "staff");
  const message = ("messages" in refreshed ? refreshed.messages : []).at(-1) as
    | MessageItem
    | undefined;

  return NextResponse.json({ ok: true, messageId: result.messageId, message });
}
