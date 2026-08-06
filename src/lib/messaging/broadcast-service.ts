import {
  BROADCAST_DAILY_LIMIT_PER_PROGRAM,
  MAX_BROADCAST_BODY_CHARS,
} from "@/lib/messaging/messaging-constants";
import type { BroadcastProgramOption, SendBroadcastInput } from "@/lib/messaging/messaging-types";
import { ensureMessageThread } from "@/lib/messaging/messaging-service";
import { enqueueJob } from "@/lib/jobs/queue";
import {
  messageBroadcastsTable,
  messagesTable,
} from "@/lib/reports/table-utils";
import { isDirectorOfOrg } from "@/lib/business/org-profile-service";
import { createServiceClient } from "@/lib/supabase/service";

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function listBroadcastPrograms(
  userId: string,
  orgId: string,
): Promise<BroadcastProgramOption[]> {
  if (!(await isDirectorOfOrg(userId, orgId))) {
    return [];
  }

  const service = createServiceClient();
  const { data: programs } = await service
    .from("programs")
    .select("id, name")
    .eq("org_id", orgId)
    .neq("status", "archived");

  const options: BroadcastProgramOption[] = [];

  for (const program of programs ?? []) {
    const { count } = await service
      .from("program_registrations")
      .select("id", { count: "exact", head: true })
      .eq("program_id", program.id)
      .eq("status", "active");

    options.push({
      id: program.id,
      name: program.name,
      activeFamilyCount: count ?? 0,
    });
  }

  return options;
}

export async function countBroadcastsToday(programId: string): Promise<number> {
  const service = createServiceClient();
  const { count } = await messageBroadcastsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .gte("created_at", startOfUtcDay());

  return count ?? 0;
}

export async function sendProgramBroadcast(
  userId: string,
  orgId: string,
  input: SendBroadcastInput,
): Promise<{ broadcastId: string; recipientCount: number } | { error: string }> {
  if (!(await isDirectorOfOrg(userId, orgId))) {
    return { error: "forbidden" };
  }

  const body = input.body.trim();
  if (!body || body.length > MAX_BROADCAST_BODY_CHARS) {
    return { error: "invalid_body" };
  }

  const service = createServiceClient();
  const { data: program } = await service
    .from("programs")
    .select("id, org_id, name")
    .eq("id", input.programId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!program) return { error: "program_not_found" };

  const todayCount = await countBroadcastsToday(input.programId);
  if (todayCount >= BROADCAST_DAILY_LIMIT_PER_PROGRAM) {
    return { error: "rate_limited" };
  }

  const { data: registrations } = await service
    .from("program_registrations")
    .select("id, child_id, parent_id")
    .eq("program_id", input.programId)
    .eq("status", "active");

  const families = registrations ?? [];
  if (families.length === 0) {
    return { error: "no_recipients" };
  }

  const { data: broadcast, error: broadcastError } = await messageBroadcastsTable(service)
    .insert({
      org_id: orgId,
      program_id: input.programId,
      sender_id: userId,
      body,
      recipient_count: families.length,
    })
    .select("id")
    .single();

  if (broadcastError || !broadcast) return { error: "broadcast_failed" };

  return processBroadcastMessages(
    userId,
    orgId,
    input.programId,
    body,
    broadcast.id as string,
    families,
  );
}

async function processBroadcastMessages(
  userId: string,
  orgId: string,
  programId: string,
  body: string,
  broadcastId: string,
  families: { id: string; child_id: string; parent_id: string }[],
): Promise<{ broadcastId: string; recipientCount: number } | { error: string }> {
  const service = createServiceClient();

  for (const reg of families) {
    const ensured = await ensureMessageThread({
      programId,
      childId: reg.child_id,
      registrationId: reg.id,
    });
    if ("error" in ensured) continue;

    await messagesTable(service).insert({
      thread_id: ensured.threadId,
      sender_id: userId,
      sender_role: "staff",
      body,
      message_type: "broadcast",
      broadcast_id: broadcastId,
    });

    await enqueueJob({
      type: "message_notify_recipient",
      payload: {
        threadId: ensured.threadId,
        broadcastId,
        orgId,
        programId,
        childId: reg.child_id,
        parentId: reg.parent_id,
        recipientRole: "parent",
        isBroadcast: true,
      },
      idempotencyKey: `broadcast-notify-${broadcastId}-${reg.id}`,
    });
  }

  return { broadcastId, recipientCount: families.length };
}

export async function getBroadcastQuota(
  programId: string,
): Promise<{ used: number; limit: number }> {
  const used = await countBroadcastsToday(programId);
  return { used, limit: BROADCAST_DAILY_LIMIT_PER_PROGRAM };
}
