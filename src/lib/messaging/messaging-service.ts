import {
  MAX_MESSAGE_BODY_CHARS,
  MESSAGE_PAGE_SIZE,
  THREAD_LIST_PAGE_SIZE,
} from "@/lib/messaging/messaging-constants";
import type {
  EnsureThreadInput,
  MessageItem,
  MessageThreadDetail,
  MessageThreadListItem,
  SendMessageInput,
} from "@/lib/messaging/messaging-types";
import { enqueueJob } from "@/lib/jobs/queue";
import {
  messageThreadsTable,
  messagesTable,
} from "@/lib/reports/table-utils";
import { isDirectorOfOrg } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ThreadRow = {
  id: string;
  org_id: string;
  program_id: string;
  child_id: string;
  parent_id: string;
  registration_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  parent_last_read_at: string | null;
  children: { first_name: string; last_name: string } | null;
  programs: { name: string; organizations: { name: string } | null } | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_role: string;
  body: string;
  message_type: string;
  created_at: string;
};

function mapThreadListItem(row: ThreadRow, _viewerId: string, viewerRole: "parent" | "staff"): MessageThreadListItem {
  const lastAt = row.last_message_at;
  const readAt = viewerRole === "parent" ? row.parent_last_read_at : null;
  const unread = Boolean(
    lastAt &&
      (!readAt || new Date(lastAt).getTime() > new Date(readAt).getTime()),
  );

  return {
    id: row.id,
    orgId: row.org_id,
    programId: row.program_id,
    childId: row.child_id,
    childFirstName: row.children?.first_name ?? "",
    childLastName: row.children?.last_name ?? "",
    programName: row.programs?.name ?? "",
    orgName: row.programs?.organizations?.name ?? "",
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    unread,
  };
}

async function loadSenderLabels(senderIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(senderIds.filter(Boolean))] as string[];
  if (unique.length === 0) return map;

  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  for (const row of data ?? []) {
    map.set(row.id, row.full_name?.trim() || "Staff");
  }
  return map;
}

async function canStaffAccessThread(userId: string, thread: ThreadRow): Promise<boolean> {
  if (await isDirectorOfOrg(userId, thread.org_id)) return true;

  const supabase = await createClient();
  const { data: coach } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId)
    .eq("program_id", thread.program_id)
    .maybeSingle();

  return Boolean(coach);
}

export async function ensureMessageThread(
  input: EnsureThreadInput,
): Promise<{ threadId: string } | { error: string }> {
  const service = createServiceClient();

  const { data: reg } = await service
    .from("program_registrations")
    .select("id, org_id, program_id, child_id, parent_id, status")
    .eq("program_id", input.programId)
    .eq("child_id", input.childId)
    .eq("status", "active")
    .maybeSingle();

  if (!reg) return { error: "registration_not_found" };

  const { data: existing } = await messageThreadsTable(service)
    .select("id")
    .eq("program_id", input.programId)
    .eq("child_id", input.childId)
    .maybeSingle();

  if (existing) return { threadId: existing.id as string };

  const { data: created, error } = await messageThreadsTable(service)
    .insert({
      org_id: reg.org_id,
      program_id: reg.program_id,
      child_id: reg.child_id,
      parent_id: reg.parent_id,
      registration_id: input.registrationId ?? reg.id,
    })
    .select("id")
    .single();

  if (error || !created) return { error: "create_failed" };
  return { threadId: created.id as string };
}

export async function listParentThreads(parentId: string): Promise<MessageThreadListItem[]> {
  const supabase = await createClient();
  const { data, error } = await messageThreadsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, parent_id,
      last_message_at, last_message_preview, parent_last_read_at,
      children(first_name, last_name),
      programs(name, organizations(name))
    `,
    )
    .eq("parent_id", parentId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(THREAD_LIST_PAGE_SIZE);

  if (error) throw error;

  return ((data ?? []) as ThreadRow[]).map((row) =>
    mapThreadListItem(row, parentId, "parent"),
  );
}

export async function listStaffThreads(
  userId: string,
  orgId: string,
): Promise<MessageThreadListItem[]> {
  const supabase = await createClient();
  const { data, error } = await messageThreadsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, parent_id,
      last_message_at, last_message_preview, parent_last_read_at,
      children(first_name, last_name),
      programs(name, organizations(name))
    `,
    )
    .eq("org_id", orgId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(THREAD_LIST_PAGE_SIZE);

  if (error) throw error;

  return ((data ?? []) as ThreadRow[]).map((row) =>
    mapThreadListItem(row, userId, "staff"),
  );
}

export async function listCoachThreads(
  userId: string,
  programIds: string[],
): Promise<MessageThreadListItem[]> {
  if (programIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await messageThreadsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, parent_id,
      last_message_at, last_message_preview, parent_last_read_at,
      children(first_name, last_name),
      programs(name, organizations(name))
    `,
    )
    .in("program_id", programIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(THREAD_LIST_PAGE_SIZE);

  if (error) throw error;

  return ((data ?? []) as ThreadRow[]).map((row) =>
    mapThreadListItem(row, userId, "staff"),
  );
}

export async function getThreadForParent(
  parentId: string,
  threadId: string,
): Promise<MessageThreadDetail | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await messageThreadsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, parent_id,
      last_message_at, last_message_preview, parent_last_read_at,
      children(first_name, last_name),
      programs(name, organizations(name))
    `,
    )
    .eq("id", threadId)
    .maybeSingle();

  if (error) throw error;
  if (!data || (data as ThreadRow).parent_id !== parentId) {
    return { error: "not_found" };
  }

  const row = data as ThreadRow;
  return {
    ...mapThreadListItem(row, parentId, "parent"),
    parentId: row.parent_id,
    safetyBanner: true,
  };
}

export async function getThreadForStaff(
  userId: string,
  threadId: string,
): Promise<MessageThreadDetail | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await messageThreadsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, parent_id,
      last_message_at, last_message_preview, parent_last_read_at,
      children(first_name, last_name),
      programs(name, organizations(name))
    `,
    )
    .eq("id", threadId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { error: "not_found" };

  const row = data as ThreadRow;
  if (!(await canStaffAccessThread(userId, row))) {
    return { error: "forbidden" };
  }

  return {
    ...mapThreadListItem(row, userId, "staff"),
    parentId: row.parent_id,
    safetyBanner: true,
  };
}

export async function getThreadMessages(
  userId: string,
  threadId: string,
  role: "parent" | "staff",
): Promise<{ messages: MessageItem[] } | { error: string }> {
  const thread =
    role === "parent"
      ? await getThreadForParent(userId, threadId)
      : await getThreadForStaff(userId, threadId);

  if ("error" in thread) return thread;

  const supabase = await createClient();
  const { data, error } = await messagesTable(supabase)
    .select("id, thread_id, sender_id, sender_role, body, message_type, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_PAGE_SIZE);

  if (error) throw error;

  const rows = (data ?? []) as MessageRow[];
  const labels = await loadSenderLabels(rows.map((r) => r.sender_id ?? ""));

  const messages: MessageItem[] = rows.map((row) => {
    const isOwn =
      row.sender_role === "parent"
        ? row.sender_id === userId
        : row.sender_role === "staff" && row.sender_id === userId;

    let senderLabel = "System";
    if (row.sender_role === "parent") {
      senderLabel = isOwn ? "You" : "Parent";
    } else if (row.sender_role === "staff") {
      senderLabel = row.sender_id ? labels.get(row.sender_id) ?? "Staff" : "Staff";
    } else if (row.message_type === "broadcast") {
      senderLabel = "Broadcast";
    }

    return {
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      senderRole: row.sender_role as MessageItem["senderRole"],
      senderLabel,
      body: row.body,
      messageType: row.message_type as MessageItem["messageType"],
      createdAt: row.created_at,
      isOwn,
    };
  });

  if (role === "parent") {
    await messageThreadsTable(supabase)
      .update({ parent_last_read_at: new Date().toISOString() })
      .eq("id", threadId)
      .eq("parent_id", userId);
  }

  return { messages };
}

export async function sendParentMessage(
  parentId: string,
  threadId: string,
  input: SendMessageInput,
): Promise<{ messageId: string } | { error: string }> {
  const body = input.body.trim();
  if (!body || body.length > MAX_MESSAGE_BODY_CHARS) {
    return { error: "invalid_body" };
  }

  const thread = await getThreadForParent(parentId, threadId);
  if ("error" in thread) return thread;

  const supabase = await createClient();
  const { data, error } = await messagesTable(supabase)
    .insert({
      thread_id: threadId,
      sender_id: parentId,
      sender_role: "parent",
      body,
      message_type: "text",
    })
    .select("id")
    .single();

  if (error || !data) return { error: "send_failed" };

  await enqueueJob({
    type: "message_notify_recipient",
    payload: {
      threadId,
      messageId: data.id,
      orgId: thread.orgId,
      programId: thread.programId,
      childId: thread.childId,
      recipientRole: "staff",
    },
    idempotencyKey: `message-notify-${data.id}`,
  });

  return { messageId: data.id as string };
}

export async function sendStaffMessage(
  userId: string,
  threadId: string,
  input: SendMessageInput,
): Promise<{ messageId: string } | { error: string }> {
  const body = input.body.trim();
  if (!body || body.length > MAX_MESSAGE_BODY_CHARS) {
    return { error: "invalid_body" };
  }

  const thread = await getThreadForStaff(userId, threadId);
  if ("error" in thread) return thread;

  const supabase = await createClient();
  const { data, error } = await messagesTable(supabase)
    .insert({
      thread_id: threadId,
      sender_id: userId,
      sender_role: "staff",
      body,
      message_type: "text",
    })
    .select("id")
    .single();

  if (error || !data) return { error: "send_failed" };

  await enqueueJob({
    type: "message_notify_recipient",
    payload: {
      threadId,
      messageId: data.id,
      orgId: thread.orgId,
      programId: thread.programId,
      childId: thread.childId,
      parentId: thread.parentId,
      recipientRole: "parent",
    },
    idempotencyKey: `message-notify-${data.id}`,
  });

  return { messageId: data.id as string };
}

export async function resolveThreadIdForRegistration(
  registrationId: string,
): Promise<string | null> {
  const service = createServiceClient();
  const { data: reg } = await service
    .from("program_registrations")
    .select("program_id, child_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (!reg) return null;

  const ensured = await ensureMessageThread({
    programId: reg.program_id,
    childId: reg.child_id,
    registrationId,
  });

  if ("error" in ensured) return null;
  return ensured.threadId;
}

export async function syncParentThreads(parentId: string): Promise<void> {
  const service = createServiceClient();
  const { data: registrations } = await service
    .from("program_registrations")
    .select("id, program_id, child_id")
    .eq("parent_id", parentId)
    .eq("status", "active");

  for (const reg of registrations ?? []) {
    await ensureMessageThread({
      programId: reg.program_id,
      childId: reg.child_id,
      registrationId: reg.id,
    });
  }
}

export async function resolveParentThreadFromContext(
  parentId: string,
  programId: string,
  childId?: string,
): Promise<string | null> {
  const service = createServiceClient();
  let query = service
    .from("program_registrations")
    .select("id, child_id")
    .eq("parent_id", parentId)
    .eq("program_id", programId)
    .eq("status", "active");

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: reg } = await query.limit(1).maybeSingle();
  if (!reg) return null;

  const ensured = await ensureMessageThread({
    programId,
    childId: reg.child_id,
    registrationId: reg.id,
  });

  if ("error" in ensured) return null;
  return ensured.threadId;
}
