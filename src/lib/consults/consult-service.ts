import type { ClearanceShareStatus } from "@/lib/clearance/clearance-constants";
import { getParentEntitlements } from "@/lib/billing/entitlements";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import type {
  CloseConsultInput,
  ConsultDetail,
  ConsultListItem,
  ConsultMessage,
  ConsultTimelineSnippet,
  CreateConsultInput,
} from "@/lib/consults/consult-types";
import {
  incidentConsultMessagesTable,
  incidentConsultsTable,
} from "@/lib/consults/table-utils";
import { enqueueJob } from "@/lib/jobs/queue";
import { incidentsTable, timelineEventsTable } from "@/lib/reports/table-utils";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_MESSAGE_CHARS = 4000;
const MAX_INITIAL_CHARS = 2000;
const TIMELINE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type ConsultRow = {
  id: string;
  child_id: string;
  parent_id: string;
  incident_id: string | null;
  program_id: string | null;
  org_id: string | null;
  status: string;
  priority: string;
  assigned_admin_id: string | null;
  assigned_at: string | null;
  initial_message: string;
  care_plan_summary: string | null;
  clearance_status: string | null;
  clearance_conditions: string | null;
  clearance_expires_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  consult_id: string;
  sender_id: string | null;
  sender_role: string;
  body: string;
  created_at: string;
};

function preview(text: string, max = 100): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function waitMinutes(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
}

async function loadChild(childId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("children")
    .select("id, first_name, last_name, parent_id")
    .eq("id", childId)
    .maybeSingle();
  return data as {
    id: string;
    first_name: string;
    last_name: string;
    parent_id: string;
  } | null;
}

async function resolveOrgFromChild(
  childId: string,
  programId?: string | null,
): Promise<{ orgId: string; programId: string | null } | null> {
  const service = createServiceClient();

  if (programId) {
    const { data } = await service
      .from("program_registrations")
      .select("org_id, program_id")
      .eq("child_id", childId)
      .eq("program_id", programId)
      .maybeSingle();
    if (!data?.org_id) return null;
    return { orgId: data.org_id, programId: data.program_id };
  }

  const { data } = await service
    .from("program_registrations")
    .select("org_id, program_id")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.org_id) return null;
  return { orgId: data.org_id, programId: data.program_id };
}

async function loadTimelineSnippets(
  childId: string,
): Promise<ConsultTimelineSnippet[]> {
  const service = createServiceClient();
  const since = new Date(Date.now() - TIMELINE_WINDOW_MS).toISOString();
  const { data } = await timelineEventsTable(service)
    .select("id, event_type, title, summary, occurred_at")
    .eq("child_id", childId)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row: {
    id: string;
    event_type: string;
    title: string;
    summary: string | null;
    occurred_at: string;
  }) => ({
    id: row.id,
    eventType: row.event_type,
    title: row.title,
    summary: row.summary,
    occurredAt: row.occurred_at,
  }));
}

async function loadIncidentContext(incidentId: string | null) {
  if (!incidentId) return null;
  const service = createServiceClient();
  const { data } = await incidentsTable(service)
    .select(
      "id, incident_type, severity, is_red_flag, occurred_at, mechanism, body_area, symptoms, action_taken",
    )
    .eq("id", incidentId)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    id: string;
    incident_type: string;
    severity: string;
    is_red_flag: boolean;
    occurred_at: string;
    mechanism: string | null;
    body_area: string | null;
    symptoms: string | null;
    action_taken: string | null;
  };

  return {
    id: row.id,
    incidentType: row.incident_type,
    severity: row.severity,
    isRedFlag: row.is_red_flag,
    occurredAt: row.occurred_at,
    mechanism: row.mechanism,
    bodyArea: row.body_area,
    symptoms: row.symptoms,
    actionTaken: row.action_taken,
  };
}

async function mapMessages(rows: MessageRow[]): Promise<ConsultMessage[]> {
  const adminIds = rows
    .filter((r) => r.sender_role === "admin" && r.sender_id)
    .map((r) => r.sender_id as string);
  const labelMap = new Map<string, string>();

  if (adminIds.length) {
    const service = createServiceClient();
    const { data } = await service
      .from("profiles")
      .select("id, full_name")
      .in("id", [...new Set(adminIds)]);
    for (const p of data ?? []) {
      labelMap.set(p.id, p.full_name?.trim() || "Clinical team");
    }
  }

  return rows.map((row) => ({
    id: row.id,
    senderRole: row.sender_role as ConsultMessage["senderRole"],
    senderLabel:
      row.sender_role === "system"
        ? "ANCHOR Care"
        : row.sender_role === "parent"
          ? "You"
          : labelMap.get(row.sender_id ?? "") ?? "Clinical team",
    body: row.body,
    createdAt: row.created_at,
  }));
}

async function buildConsultDetail(row: ConsultRow): Promise<ConsultDetail> {
  const service = createServiceClient();
  const child = await loadChild(row.child_id);

  let programName: string | null = null;
  let orgName: string | null = null;
  if (row.program_id) {
    const { data: program } = await service
      .from("programs")
      .select("name, organizations(name)")
      .eq("id", row.program_id)
      .maybeSingle();
    programName = program?.name ?? null;
    orgName =
      (program?.organizations as { name: string } | null)?.name ?? null;
  }

  const { data: messageRows } = await incidentConsultMessagesTable(service)
    .select("id, consult_id, sender_id, sender_role, body, created_at")
    .eq("consult_id", row.id)
    .order("created_at", { ascending: true });

  const [incident, timelineSnippets, messages] = await Promise.all([
    loadIncidentContext(row.incident_id),
    loadTimelineSnippets(row.child_id),
    mapMessages((messageRows ?? []) as MessageRow[]),
  ]);

  return {
    id: row.id,
    childId: row.child_id,
    childFirstName: child?.first_name ?? "",
    childLastName: child?.last_name ?? "",
    parentId: row.parent_id,
    incidentId: row.incident_id,
    programId: row.program_id,
    programName,
    orgName,
    status: row.status as ConsultDetail["status"],
    priority: row.priority as ConsultDetail["priority"],
    assignedAdminId: row.assigned_admin_id,
    initialMessage: row.initial_message,
    carePlanSummary: row.care_plan_summary,
    clearanceStatus: row.clearance_status as ClearanceShareStatus | null,
    clearanceConditions: row.clearance_conditions,
    clearanceExpiresAt: row.clearance_expires_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    incident,
    timelineSnippets,
    messages,
  };
}

function mapListItem(
  row: ConsultRow,
  childFirstName: string,
  programName: string | null,
): ConsultListItem {
  return {
    id: row.id,
    childId: row.child_id,
    childFirstName,
    status: row.status as ConsultListItem["status"],
    priority: row.priority as ConsultListItem["priority"],
    incidentId: row.incident_id,
    programName,
    initialMessagePreview: preview(row.initial_message),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    waitMinutes: waitMinutes(row.created_at),
  };
}

export async function countPendingConsults(): Promise<number> {
  const service = createServiceClient();
  const { count } = await incidentConsultsTable(service)
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "assigned", "open"]);
  return count ?? 0;
}

export async function listConsultsForParent(
  parentId: string,
): Promise<ConsultListItem[]> {
  const service = createServiceClient();
  const { data } = await incidentConsultsTable(service)
    .select("*")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ConsultRow[];
  if (!rows.length) return [];

  const childIds = [...new Set(rows.map((r) => r.child_id))];
  const { data: children } = await service
    .from("children")
    .select("id, first_name")
    .in("id", childIds);
  const nameMap = new Map(
    (children ?? []).map((c: { id: string; first_name: string }) => [
      c.id,
      c.first_name,
    ]),
  );

  const programIds = [...new Set(rows.map((r) => r.program_id).filter(Boolean))];
  const programMap = new Map<string, string>();
  if (programIds.length) {
    const { data: programs } = await service
      .from("programs")
      .select("id, name")
      .in("id", programIds as string[]);
    for (const p of programs ?? []) {
      programMap.set(p.id, p.name);
    }
  }

  return rows.map((row) =>
    mapListItem(
      row,
      nameMap.get(row.child_id) ?? "Child",
      row.program_id ? programMap.get(row.program_id) ?? null : null,
    ),
  );
}

export async function listConsultsForAdmin(): Promise<ConsultListItem[]> {
  const service = createServiceClient();
  const { data } = await incidentConsultsTable(service)
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as ConsultRow[];
  if (!rows.length) return [];

  const childIds = [...new Set(rows.map((r) => r.child_id))];
  const { data: children } = await service
    .from("children")
    .select("id, first_name")
    .in("id", childIds);
  const nameMap = new Map(
    (children ?? []).map((c: { id: string; first_name: string }) => [
      c.id,
      c.first_name,
    ]),
  );

  const programIds = [...new Set(rows.map((r) => r.program_id).filter(Boolean))];
  const programMap = new Map<string, string>();
  if (programIds.length) {
    const { data: programs } = await service
      .from("programs")
      .select("id, name")
      .in("id", programIds as string[]);
    for (const p of programs ?? []) {
      programMap.set(p.id, p.name);
    }
  }

  return rows.map((row) =>
    mapListItem(
      row,
      nameMap.get(row.child_id) ?? "Child",
      row.program_id ? programMap.get(row.program_id) ?? null : null,
    ),
  );
}

export async function getConsultForParent(
  parentId: string,
  consultId: string,
): Promise<ConsultDetail | null> {
  const service = createServiceClient();
  const { data } = await incidentConsultsTable(service)
    .select("*")
    .eq("id", consultId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!data) return null;
  return buildConsultDetail(data as ConsultRow);
}

export async function getConsultForAdmin(
  consultId: string,
): Promise<ConsultDetail | null> {
  const service = createServiceClient();
  const { data } = await incidentConsultsTable(service)
    .select("*")
    .eq("id", consultId)
    .maybeSingle();

  if (!data) return null;
  return buildConsultDetail(data as ConsultRow);
}

export async function createConsult(
  parentId: string,
  input: CreateConsultInput,
): Promise<{ ok: true; consultId: string } | { ok: false; error: string }> {
  const entitlements = await getParentEntitlements(parentId);
  if (!entitlements.canAccessCare) {
    return { ok: false, error: "family_plan_required" };
  }

  const message = input.initialMessage.trim();
  if (!message || message.length > MAX_INITIAL_CHARS) {
    return { ok: false, error: "invalid_message" };
  }

  const child = await loadChild(input.childId);
  if (!child || child.parent_id !== parentId) {
    return { ok: false, error: "child_not_found" };
  }

  const orgContext = await resolveOrgFromChild(
    input.childId,
    input.programId ?? undefined,
  );
  if (!orgContext) {
    return { ok: false, error: "child_not_linked" };
  }

  let priority: "normal" | "high" = "normal";
  let incidentId: string | null = input.incidentId ?? null;
  let programId = input.programId ?? orgContext.programId;

  if (incidentId) {
    const service = createServiceClient();
    const { data: incident } = await incidentsTable(service)
      .select("id, child_id, is_red_flag, program_id")
      .eq("id", incidentId)
      .maybeSingle();

    if (!incident || incident.child_id !== input.childId) {
      return { ok: false, error: "incident_not_found" };
    }
    if (incident.is_red_flag) priority = "high";
    programId = programId ?? incident.program_id;
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: consult, error } = await incidentConsultsTable(service)
    .insert({
      child_id: input.childId,
      parent_id: parentId,
      incident_id: incidentId,
      program_id: programId,
      org_id: orgContext.orgId,
      status: "pending",
      priority,
      initial_message: message,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !consult) {
    return { ok: false, error: "create_failed" };
  }

  await incidentConsultMessagesTable(service).insert({
    consult_id: consult.id,
    sender_id: parentId,
    sender_role: "parent",
    body: message,
    created_at: now,
  });

  await enqueueJob({
    type: "consult_notify_admin",
    idempotencyKey: `consult_notify_admin:${consult.id}`,
    payload: {
      consultId: consult.id,
      priority,
      parentId,
      childId: input.childId,
    },
  });

  return { ok: true, consultId: consult.id };
}

export async function assignConsult(
  adminId: string,
  consultId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPlatformAdmin(adminId))) {
    return { ok: false, error: "forbidden" };
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await incidentConsultsTable(service)
    .update({
      status: "open",
      assigned_admin_id: adminId,
      assigned_at: now,
      updated_at: now,
    })
    .eq("id", consultId)
    .in("status", ["pending", "assigned"])
    .select("id, parent_id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  await incidentConsultMessagesTable(service).insert({
    consult_id: consultId,
    sender_id: null,
    sender_role: "system",
    body: "A clinician has joined your consult.",
    created_at: now,
  });

  await enqueueJob({
    type: "consult_notify_parent",
    idempotencyKey: `consult_assigned:${consultId}`,
    payload: {
      consultId,
      parentId: data.parent_id,
      event: "assigned",
    },
  });

  return { ok: true };
}

export async function sendConsultMessage(
  userId: string,
  consultId: string,
  body: string,
  role: "parent" | "admin",
): Promise<{ ok: true; message: ConsultMessage } | { ok: false; error: string }> {
  const text = body.trim();
  if (!text || text.length > MAX_MESSAGE_CHARS) {
    return { ok: false, error: "invalid_message" };
  }

  const service = createServiceClient();
  const { data: consult } = await incidentConsultsTable(service)
    .select("id, parent_id, status, assigned_admin_id")
    .eq("id", consultId)
    .maybeSingle();

  if (!consult) return { ok: false, error: "not_found" };

  if (role === "parent") {
    if (consult.parent_id !== userId) return { ok: false, error: "forbidden" };
    if (!["assigned", "open"].includes(consult.status)) {
      return { ok: false, error: "consult_closed" };
    }
  } else {
    if (!(await isPlatformAdmin(userId))) {
      return { ok: false, error: "forbidden" };
    }
    if (consult.status === "closed") {
      return { ok: false, error: "consult_closed" };
    }
    if (consult.status === "pending") {
      await assignConsult(userId, consultId);
    }
  }

  const now = new Date().toISOString();
  const { data: row, error } = await incidentConsultMessagesTable(service)
    .insert({
      consult_id: consultId,
      sender_id: userId,
      sender_role: role,
      body: text,
      created_at: now,
    })
    .select("id, consult_id, sender_id, sender_role, body, created_at")
    .single();

  if (error || !row) return { ok: false, error: "send_failed" };

  await incidentConsultsTable(service)
    .update({ updated_at: now, status: "open" })
    .eq("id", consultId);

  const [message] = await mapMessages([row as MessageRow]);

  if (role === "admin") {
    await enqueueJob({
      type: "consult_notify_parent",
      idempotencyKey: `consult_reply:${row.id}`,
      payload: {
        consultId,
        parentId: consult.parent_id,
        event: "reply",
      },
    });
  }

  return { ok: true, message };
}

export async function closeConsult(
  adminId: string,
  consultId: string,
  input: CloseConsultInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPlatformAdmin(adminId))) {
    return { ok: false, error: "forbidden" };
  }

  const summary = input.carePlanSummary.trim();
  if (!summary) return { ok: false, error: "invalid_summary" };

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await incidentConsultsTable(service)
    .update({
      status: "closed",
      care_plan_summary: summary,
      clearance_status: input.clearanceStatus,
      clearance_conditions: input.clearanceConditions ?? null,
      clearance_expires_at: input.clearanceExpiresAt ?? null,
      closed_at: now,
      closed_by: adminId,
      updated_at: now,
    })
    .eq("id", consultId)
    .neq("status", "closed")
    .select("id, parent_id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "not_found" };

  await incidentConsultMessagesTable(service).insert({
    consult_id: consultId,
    sender_id: null,
    sender_role: "system",
    body: "This consult is closed. Your care plan summary is saved below.",
    created_at: now,
  });

  await enqueueJob({
    type: "consult_notify_parent",
    idempotencyKey: `consult_closed:${consultId}`,
    payload: {
      consultId,
      parentId: data.parent_id,
      event: "closed",
    },
  });

  return { ok: true };
}
