import {
  INCIDENT_AMEND_WINDOW_MS,
  INCIDENT_AMENDABLE_FIELDS,
  INCIDENT_PHOTOS_BUCKET,
  INCIDENT_SIGNED_URL_TTL,
  type ParentIncidentAction,
} from "@/lib/incidents/incident-detail-constants";
import type {
  AmendIncidentInput,
  IncidentAuditDiff,
  IncidentAuditEntry,
  IncidentDetail,
  IncidentDetailRole,
  IncidentWitness,
} from "@/lib/incidents/incident-types";
import { enqueueJob, processBackgroundJobs } from "@/lib/jobs/queue";
import {
  incidentAuditLogTable,
  incidentPhotosTable,
  incidentsTable,
  timelineEventsTable,
} from "@/lib/reports/table-utils";
import { isDirectorOfOrg } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type IncidentFullRow = {
  id: string;
  org_id: string;
  program_id: string;
  child_id: string;
  reported_by: string;
  incident_type: string;
  severity: string;
  is_red_flag: boolean;
  occurred_at: string;
  location: string | null;
  mechanism: string | null;
  body_area: string | null;
  symptoms: string | null;
  pain_level: number | null;
  action_taken: string | null;
  witnesses: IncidentWitness[] | null;
  status: string;
  parent_notified_at: string | null;
  created_at: string;
  updated_at: string;
  programs: { name: string } | null;
  children: { first_name: string; last_name: string; parent_id: string } | null;
  organizations: { name: string } | null;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type PhotoRow = {
  id: string;
  storage_path: string;
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  location: "location",
  mechanism: "mechanism",
  body_area: "bodyArea",
  symptoms: "symptoms",
  pain_level: "painLevel",
  action_taken: "actionTaken",
  witnesses: "witnesses",
};

function formatFieldValue(field: string, value: unknown): string {
  if (value == null) return "—";
  if (field === "witnesses") {
    const list = value as IncidentWitness[];
    if (!Array.isArray(list) || list.length === 0) return "—";
    return list.map((w) => `${w.name}${w.role ? ` (${w.role})` : ""}`).join(", ");
  }
  return String(value);
}

function buildDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): IncidentAuditDiff[] {
  const diffs: IncidentAuditDiff[] = [];
  for (const field of INCIDENT_AMENDABLE_FIELDS) {
    const b = formatFieldValue(field, before[field]);
    const a = formatFieldValue(field, after[field]);
    if (b !== a) {
      diffs.push({
        field,
        labelKey: FIELD_LABEL_KEYS[field] ?? field,
        before: b,
        after: a,
      });
    }
  }
  return diffs;
}

function amendDeadlineIso(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + INCIDENT_AMEND_WINDOW_MS).toISOString();
}

function withinAmendWindow(createdAt: string): boolean {
  return Date.now() < new Date(createdAt).getTime() + INCIDENT_AMEND_WINDOW_MS;
}

async function signedPhotoUrl(path: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service.storage
    .from(INCIDENT_PHOTOS_BUCKET)
    .createSignedUrl(path, INCIDENT_SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

async function resolveRole(
  userId: string,
  incident: IncidentFullRow,
): Promise<IncidentDetailRole | null> {
  if (incident.children?.parent_id === userId) return "parent";

  const supabase = await createClient();
  const { data: coach } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId)
    .eq("program_id", incident.program_id)
    .maybeSingle();
  if (coach) return "coach";

  if (await isDirectorOfOrg(userId, incident.org_id)) return "director";

  return null;
}

async function loadActorLabels(actorIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(actorIds.filter(Boolean))];
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

type SupabaseDbClient = Awaited<ReturnType<typeof createClient>>;

async function fetchIncidentRow(
  incidentId: string,
  client: SupabaseDbClient,
): Promise<IncidentFullRow | null> {
  const { data, error } = await incidentsTable(client)
    .select(
      `
      id, org_id, program_id, child_id, reported_by, incident_type, severity,
      is_red_flag, occurred_at, location, mechanism, body_area, symptoms,
      pain_level, action_taken, witnesses, status, parent_notified_at,
      created_at, updated_at,
      programs(name),
      children(first_name, last_name, parent_id),
      organizations(name)
    `,
    )
    .eq("id", incidentId)
    .maybeSingle();

  if (error) throw error;
  return (data as IncidentFullRow | null) ?? null;
}

export async function getIncidentDetail(
  userId: string,
  incidentId: string,
): Promise<IncidentDetail | { error: string }> {
  const supabase = await createClient();
  const incident = await fetchIncidentRow(incidentId, supabase);
  if (!incident) return { error: "not_found" };

  const role = await resolveRole(userId, incident);
  if (!role) return { error: "forbidden" };

  const { data: auditRows } = await incidentAuditLogTable(supabase)
    .select("id, actor_id, action, metadata, created_at")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  const { data: photoRows } = await incidentPhotosTable(supabase)
    .select("id, storage_path")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  const actorIds = (auditRows ?? []).map((r: AuditRow) => r.actor_id).filter(Boolean) as string[];
  const actorLabels = await loadActorLabels(actorIds);

  const auditTrail: IncidentAuditEntry[] = (auditRows ?? []).map((row: AuditRow) => ({
    id: row.id,
    action: row.action,
    actorId: row.actor_id,
    actorLabel: row.actor_id ? actorLabels.get(row.actor_id) ?? "Staff" : "System",
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
    diff: Array.isArray(row.metadata?.diff)
      ? (row.metadata.diff as IncidentAuditDiff[])
      : [],
  }));

  const photos = await Promise.all(
    ((photoRows ?? []) as PhotoRow[]).map(async (p) => {
      const signedUrl = await signedPhotoUrl(p.storage_path);
      return signedUrl ? { id: p.id, signedUrl } : null;
    }),
  );

  const canAmend =
    role === "director" && withinAmendWindow(incident.created_at) && incident.status !== "closed";

  return {
    id: incident.id,
    orgId: incident.org_id,
    programId: incident.program_id,
    programName: incident.programs?.name ?? "",
    orgName: incident.organizations?.name ?? "",
    childId: incident.child_id,
    childFirstName: incident.children?.first_name ?? "",
    childLastName: incident.children?.last_name ?? "",
    incidentType: incident.incident_type,
    severity: incident.severity as IncidentDetail["severity"],
    isRedFlag: incident.is_red_flag,
    occurredAt: incident.occurred_at,
    location: incident.location,
    mechanism: incident.mechanism,
    bodyArea: incident.body_area,
    symptoms: incident.symptoms,
    painLevel: incident.pain_level,
    actionTaken: incident.action_taken,
    witnesses: (incident.witnesses as IncidentWitness[]) ?? [],
    status: incident.status,
    parentNotifiedAt: incident.parent_notified_at,
    createdAt: incident.created_at,
    updatedAt: incident.updated_at,
    photos: photos.filter(Boolean) as IncidentDetail["photos"],
    auditTrail,
    role,
    canAmend,
    amendDeadline: canAmend ? amendDeadlineIso(incident.created_at) : null,
  };
}

/** Service-role export path for background PDF jobs (no session). */
export async function getIncidentDetailForServiceExport(
  incidentId: string,
): Promise<IncidentDetail | null> {
  const service = createServiceClient();
  const incident = await fetchIncidentRow(incidentId, service);
  if (!incident) return null;

  const { data: auditRows } = await incidentAuditLogTable(service)
    .select("id, actor_id, action, metadata, created_at")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  const { data: photoRows } = await incidentPhotosTable(service)
    .select("id, storage_path")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  const actorIds = (auditRows ?? []).map((r: AuditRow) => r.actor_id).filter(Boolean) as string[];
  const actorLabels = await loadActorLabels(actorIds);

  const auditTrail: IncidentAuditEntry[] = (auditRows ?? []).map((row: AuditRow) => ({
    id: row.id,
    action: row.action,
    actorId: row.actor_id,
    actorLabel: row.actor_id ? actorLabels.get(row.actor_id) ?? "Staff" : "System",
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
    diff: Array.isArray(row.metadata?.diff)
      ? (row.metadata.diff as IncidentAuditDiff[])
      : [],
  }));

  const photos = await Promise.all(
    ((photoRows ?? []) as PhotoRow[]).map(async (p) => {
      const signedUrl = await signedPhotoUrl(p.storage_path);
      return signedUrl ? { id: p.id, signedUrl } : null;
    }),
  );

  return {
    id: incident.id,
    orgId: incident.org_id,
    programId: incident.program_id,
    programName: incident.programs?.name ?? "",
    orgName: incident.organizations?.name ?? "",
    childId: incident.child_id,
    childFirstName: incident.children?.first_name ?? "",
    childLastName: incident.children?.last_name ?? "",
    incidentType: incident.incident_type,
    severity: incident.severity as IncidentDetail["severity"],
    isRedFlag: incident.is_red_flag,
    occurredAt: incident.occurred_at,
    location: incident.location,
    mechanism: incident.mechanism,
    bodyArea: incident.body_area,
    symptoms: incident.symptoms,
    painLevel: incident.pain_level,
    actionTaken: incident.action_taken,
    witnesses: (incident.witnesses as IncidentWitness[]) ?? [],
    status: incident.status,
    parentNotifiedAt: incident.parent_notified_at,
    createdAt: incident.created_at,
    updatedAt: incident.updated_at,
    photos: photos.filter(Boolean) as IncidentDetail["photos"],
    auditTrail,
    role: "director",
    canAmend: false,
    amendDeadline: null,
  };
}

export async function amendIncident(
  userId: string,
  incidentId: string,
  input: AmendIncidentInput,
): Promise<{ ok: true } | { error: string }> {
  if (!input.amendReason.trim()) {
    return { error: "reason_required" };
  }

  const service = createServiceClient();
  const incident = await fetchIncidentRow(incidentId, service);
  if (!incident) return { error: "not_found" };

  if (!(await isDirectorOfOrg(userId, incident.org_id))) {
    return { error: "forbidden" };
  }

  if (!withinAmendWindow(incident.created_at)) {
    return { error: "window_closed" };
  }

  const before = {
    location: incident.location,
    mechanism: incident.mechanism,
    body_area: incident.body_area,
    symptoms: incident.symptoms,
    pain_level: incident.pain_level,
    action_taken: incident.action_taken,
    witnesses: incident.witnesses ?? [],
  };

  const after = {
    location: input.location?.trim() ?? incident.location,
    mechanism: input.mechanism?.trim() ?? incident.mechanism,
    body_area: input.bodyArea !== undefined ? input.bodyArea : incident.body_area,
    symptoms: input.symptoms?.trim() ?? incident.symptoms,
    pain_level: input.painLevel !== undefined ? input.painLevel : incident.pain_level,
    action_taken: input.actionTaken?.trim() ?? incident.action_taken,
    witnesses: input.witnesses ?? incident.witnesses ?? [],
  };

  const diff = buildDiff(before, after);
  if (diff.length === 0) {
    return { error: "no_changes" };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await incidentsTable(service)
    .update({
      location: after.location,
      mechanism: after.mechanism,
      body_area: after.body_area,
      symptoms: after.symptoms,
      pain_level: after.pain_level,
      action_taken: after.action_taken,
      witnesses: after.witnesses,
      status: "amended",
      updated_at: now,
    })
    .eq("id", incidentId);

  if (updateError) return { error: "update_failed" };

  const { data: auditRow } = await incidentAuditLogTable(service)
    .insert({
      incident_id: incidentId,
      actor_id: userId,
      action: "amended",
      metadata: {
        reason: input.amendReason.trim(),
        diff,
        before,
        after,
      },
    })
    .select("id")
    .single();

  await timelineEventsTable(service).insert({
    child_id: incident.child_id,
    org_id: incident.org_id,
    program_id: incident.program_id,
    event_type: "incident",
    title: "Incident report updated",
    summary: input.amendReason.trim().slice(0, 200),
    metadata: {
      incidentId,
      amended: true,
      diffFields: diff.map((d) => d.field),
    },
    occurred_at: now,
    created_by: userId,
  });

  await enqueueJob({
    type: "incident_amend_notify_parent",
    payload: {
      incidentId,
      childId: incident.child_id,
      priority: incident.is_red_flag ? "high" : "standard",
      auditEntryId: auditRow?.id,
    },
    idempotencyKey: `incident-amend-notify-${incidentId}-${auditRow?.id ?? now}`,
  });

  void processBackgroundJobs(2).catch(() => undefined);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await incidentAuditLogTable(service).insert({
      incident_id: incidentId,
      actor_id: null,
      action: "parent_amend_notified",
      metadata: { channel: "dev_simulated" },
    });
  }

  return { ok: true };
}

export async function recordParentIncidentAction(
  userId: string,
  incidentId: string,
  action: ParentIncidentAction,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const incident = await fetchIncidentRow(incidentId, supabase);
  if (!incident) return { error: "not_found" };

  if (incident.children?.parent_id !== userId) {
    return { error: "forbidden" };
  }

  const service = createServiceClient();
  await incidentAuditLogTable(service).insert({
    incident_id: incidentId,
    actor_id: userId,
    action: `parent_${action}`,
    metadata: { action },
  });

  return { ok: true };
}
