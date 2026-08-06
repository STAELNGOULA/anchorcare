import { MAX_MESSAGE_BODY_CHARS } from "@/lib/messaging/messaging-constants";
import {
  ensureMessageThread,
} from "@/lib/messaging/messaging-service";
import { enqueueJob } from "@/lib/jobs/queue";
import { createServiceClient } from "@/lib/supabase/service";

const SMS_REPLY_DAILY_LIMIT = 5;
const SMS_BODY_MAX = 160;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function smsLogTable(client: { from: (t: string) => any }) {
  return client.from("sms_inbound_log" as "organizations");
}

export type SmsInboundResult = {
  status: "processed" | "rejected" | "rate_limited" | "unknown_sender";
  twiml: string;
};

export async function handleTwilioInboundSms(input: {
  from: string;
  body: string;
  messageSid: string;
}): Promise<SmsInboundResult> {
  const service = createServiceClient();
  const fromNorm = normalizePhone(input.from);
  const body = input.body.trim().slice(0, MAX_MESSAGE_BODY_CHARS);

  const autoReply = (text: string) =>
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${text}</Message></Response>`;

  if (!body) {
    await smsLogTable(service).insert({
      from_phone: input.from,
      body: "",
      twilio_message_sid: input.messageSid,
      status: "rejected",
    });
    return {
      status: "rejected",
      twiml: autoReply("Message empty. Reply in ANCHOR app."),
    };
  }

  let parentId: string | null = null;

  const { data: profileRows } = await service
    .from("profiles")
    .select("id, role")
    .limit(500);

  for (const row of profileRows ?? []) {
    const phone = (row as { phone?: string }).phone;
    if (phone && normalizePhone(phone) === fromNorm) {
      parentId = row.id;
      break;
    }
  }

  if (!parentId) {
    const { data: contacts } = await service
      .from("child_emergency_contacts")
      .select("phone, children(parent_id)");

    for (const row of contacts ?? []) {
      const contactPhone = (row as { phone?: string }).phone;
      if (!contactPhone || normalizePhone(contactPhone) !== fromNorm) continue;
      const child = (row as { children: { parent_id: string } | null }).children;
      if (child?.parent_id) {
        parentId = child.parent_id;
        break;
      }
    }
  }

  if (!parentId) {
    await smsLogTable(service).insert({
      from_phone: input.from,
      body: body.slice(0, SMS_BODY_MAX),
      twilio_message_sid: input.messageSid,
      status: "unknown_sender",
    });
    return {
      status: "unknown_sender",
      twiml: autoReply("Unknown number. Open your ANCHOR report link to activate."),
    };
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { count } = await smsLogTable(service)
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId)
    .gte("created_at", dayStart.toISOString())
    .eq("status", "processed");

  if ((count ?? 0) >= SMS_REPLY_DAILY_LIMIT) {
    await smsLogTable(service).insert({
      parent_id: parentId,
      from_phone: input.from,
      body: body.slice(0, SMS_BODY_MAX),
      twilio_message_sid: input.messageSid,
      status: "rate_limited",
    });
    return {
      status: "rate_limited",
      twiml: autoReply("Daily SMS limit reached. Continue in ANCHOR app."),
    };
  }

  const { data: tokenRow } = await service
    .from("report_access_tokens" as "program_registrations")
    .select("child_id, daily_report_id, report_child_id")
    .eq("parent_id", parentId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const token = tokenRow as {
    child_id: string;
    report_child_id: string;
  } | null;

  if (!token) {
    const { data: reg } = await service
      .from("program_registrations")
      .select("program_id, child_id, id")
      .eq("parent_id", parentId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reg) {
      await smsLogTable(service).insert({
        parent_id: parentId,
        from_phone: input.from,
        body: body.slice(0, SMS_BODY_MAX),
        twilio_message_sid: input.messageSid,
        status: "rejected",
      });
      return {
        status: "rejected",
        twiml: autoReply("No active program thread. Open ANCHOR app."),
      };
    }

    const thread = await ensureMessageThread({
      programId: reg.program_id,
      childId: reg.child_id,
      registrationId: reg.id,
    });

    if ("error" in thread) {
      return {
        status: "rejected",
        twiml: autoReply("Could not deliver message. Try ANCHOR app."),
      };
    }

    await insertSmsMessage(service, thread.threadId, parentId, body);
    await smsLogTable(service).insert({
      parent_id: parentId,
      thread_id: thread.threadId,
      from_phone: input.from,
      body: body.slice(0, SMS_BODY_MAX),
      twilio_message_sid: input.messageSid,
      status: "processed",
    });

    return {
      status: "processed",
      twiml: autoReply("Message received. Staff will reply in ANCHOR."),
    };
  }

  const { data: reportChild } = await service
    .from("report_children" as "program_registrations")
    .select("child_id, daily_reports(program_id)")
    .eq("id", token.report_child_id)
    .maybeSingle();

  const programId = (
    reportChild as { daily_reports?: { program_id: string } | null; child_id?: string } | null
  )?.daily_reports?.program_id;
  const childId =
    (reportChild as { child_id?: string } | null)?.child_id ?? token.child_id;

  if (!programId || !childId) {
    return {
      status: "rejected",
      twiml: autoReply("Could not route message. Open ANCHOR app."),
    };
  }

  const thread = await ensureMessageThread({ programId, childId });
  if ("error" in thread) {
    return {
      status: "rejected",
      twiml: autoReply("Could not deliver message. Try ANCHOR app."),
    };
  }

  await insertSmsMessage(service, thread.threadId, parentId, body);
  await smsLogTable(service).insert({
    parent_id: parentId,
    thread_id: thread.threadId,
    from_phone: input.from,
    body: body.slice(0, SMS_BODY_MAX),
    twilio_message_sid: input.messageSid,
    status: "processed",
  });

  await enqueueJob({
    type: "message_notify_recipient",
    payload: {
      threadId: thread.threadId,
      orgId: "",
      programId,
      childId,
      recipientRole: "staff",
    },
    idempotencyKey: `sms-inbound-${input.messageSid}`,
  });

  const truncated = body.length > SMS_BODY_MAX;
  return {
    status: "processed",
    twiml: truncated
      ? autoReply("Message received (truncated). Continue in ANCHOR app.")
      : autoReply("Message received. Staff will reply in ANCHOR."),
  };
}

async function insertSmsMessage(
  service: ReturnType<typeof createServiceClient>,
  threadId: string,
  parentId: string,
  body: string,
) {
  await service.from("messages" as "organizations").insert({
    thread_id: threadId,
    sender_id: parentId,
    sender_role: "parent",
    body: body.slice(0, MAX_MESSAGE_BODY_CHARS),
    message_type: "sms",
  } as never);
}
