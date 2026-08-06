import {
  INCIDENT_PHOTOS_BUCKET,
  MAX_INCIDENT_PHOTO_BYTES,
  templateById,
} from "@/lib/incidents/incident-constants";
import type {
  CreateIncidentInput,
  CreateIncidentResult,
  IncidentFormContext,
  IncidentListItem,
  IncidentRosterChild,
} from "@/lib/incidents/incident-types";
import { enqueueJob, processBackgroundJobs } from "@/lib/jobs/queue";
import {
  incidentAuditLogTable,
  incidentPhotosTable,
  incidentsTable,
  timelineEventsTable,
} from "@/lib/reports/table-utils";
import { assertCoachProgramAccess } from "@/lib/reports/voice-report-service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SIGNED_URL_TTL = 3600;
const LIST_PAGE_SIZE = 30;

type EnrolledRow = {
  registration_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  parent_id: string;
  program_id: string;
  program_name: string;
};

type AllergyItem = { name: string; severity: string };

type IncidentRow = {
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
  status: string;
  parent_notified_at: string | null;
  notification_staged_at: string | null;
  programs: { name: string } | null;
  children: { first_name: string; last_name: string } | null;
};

async function loadCoachPrograms(userId: string) {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId);

  const programIds = (assignments ?? []).map((a) => a.program_id);
  if (programIds.length === 0) return [];

  const { data } = await supabase
    .from("programs")
    .select("id, name")
    .in("id", programIds)
    .neq("status", "archived");

  return data ?? [];
}

async function loadEnrolledForPrograms(
  programIds: string[],
): Promise<EnrolledRow[]> {
  if (programIds.length === 0) return [];
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roster = service.from("roster_entries" as "program_registrations") as any;
  const { data } = await roster
    .select(
      "registration_id, child_id, first_name, last_name, photo_url, parent_id, program_id, program_name",
    )
    .in("program_id", programIds)
    .eq("registration_status", "active");
  return (data ?? []) as EnrolledRow[];
}

async function signedChildAvatar(photoPath: string | null): Promise<string | null> {
  if (!photoPath) return null;
  const service = createServiceClient();
  const { data } = await service.storage
    .from("child-photos")
    .createSignedUrl(photoPath, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

async function loadChildAllergies(
  childIds: string[],
): Promise<Map<string, AllergyItem[]>> {
  const map = new Map<string, AllergyItem[]>();
  if (childIds.length === 0) return map;

  const service = createServiceClient();
  const { data } = await service
    .from("children")
    .select("id, allergy_items")
    .in("id", childIds);

  for (const row of data ?? []) {
    const items = Array.isArray(row.allergy_items)
      ? (row.allergy_items as AllergyItem[])
      : [];
    map.set(row.id, items);
  }
  return map;
}

export async function getIncidentFormContext(
  userId: string,
  programId?: string,
): Promise<IncidentFormContext | { error: string }> {
  const programs = await loadCoachPrograms(userId);
  if (programs.length === 0) {
    return { error: "no_programs" };
  }

  const activeProgramId = programId ?? programs[0]!.id;
  const access = await assertCoachProgramAccess(userId, activeProgramId);
  if (!access.ok) {
    return { error: access.error };
  }

  const service = createServiceClient();
  const { data: org } = await service
    .from("organizations")
    .select("id, org_type")
    .eq("id", access.orgId)
    .maybeSingle();

  const programIds = programs.map((p) => p.id);
  const enrolled = await loadEnrolledForPrograms(programIds);
  const allergyMap = await loadChildAllergies(enrolled.map((e) => e.child_id));

  const children: IncidentRosterChild[] = await Promise.all(
    enrolled.map(async (row) => ({
      childId: row.child_id,
      registrationId: row.registration_id,
      firstName: row.first_name,
      lastName: row.last_name,
      photoSignedUrl: await signedChildAvatar(row.photo_url),
      allergies: allergyMap.get(row.child_id) ?? [],
      programId: row.program_id,
      programName: row.program_name,
    })),
  );

  return {
    orgId: access.orgId,
    orgType: org?.org_type ?? null,
    programs: programs.map((p) => ({ id: p.id, name: p.name })),
    children,
  };
}

function mapListItem(row: IncidentRow): IncidentListItem {
  return {
    id: row.id,
    childId: row.child_id,
    childFirstName: row.children?.first_name ?? "",
    childLastName: row.children?.last_name ?? "",
    programId: row.program_id,
    programName: row.programs?.name ?? "",
    incidentType: row.incident_type,
    severity: row.severity as IncidentListItem["severity"],
    isRedFlag: row.is_red_flag,
    occurredAt: row.occurred_at,
    location: row.location,
    status: row.status,
    parentNotifiedAt: row.parent_notified_at,
    notificationStagedAt: row.notification_staged_at,
    reportedByName: null,
  };
}

export async function listIncidentsForCoach(
  userId: string,
  opts: { programId?: string; page?: number } = {},
): Promise<{ items: IncidentListItem[]; page: number; hasMore: boolean }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * LIST_PAGE_SIZE;
  const to = from + LIST_PAGE_SIZE;

  const supabase = await createClient();
  let query = incidentsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, reported_by, incident_type, severity,
      is_red_flag, occurred_at, location, status, parent_notified_at,
      notification_staged_at,
      programs(name),
      children(first_name, last_name)
    `,
      { count: "exact" },
    )
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (opts.programId) {
    query = query.eq("program_id", opts.programId);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const items = ((data ?? []) as unknown as IncidentRow[]).map(mapListItem);
  const total = count ?? 0;

  return {
    items,
    page,
    hasMore: to + 1 < total,
  };
}

export type BusinessIncidentFilters = {
  severity?: string;
  programId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
};

export async function listIncidentsForOrg(
  orgId: string,
  filters: BusinessIncidentFilters = {},
): Promise<{ items: IncidentListItem[]; page: number; hasMore: boolean }> {
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * LIST_PAGE_SIZE;
  const to = from + LIST_PAGE_SIZE;

  const supabase = createServiceClient();
  let query = incidentsTable(supabase)
    .select(
      `
      id, org_id, program_id, child_id, reported_by, incident_type, severity,
      is_red_flag, occurred_at, location, status, parent_notified_at,
      notification_staged_at,
      programs(name),
      children(first_name, last_name)
    `,
      { count: "exact" },
    )
    .eq("org_id", orgId)
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (filters.severity && filters.severity !== "all") {
    query = query.eq("severity", filters.severity);
  }
  if (filters.programId) {
    query = query.eq("program_id", filters.programId);
  }
  if (filters.fromDate) {
    query = query.gte("occurred_at", filters.fromDate);
  }
  if (filters.toDate) {
    query = query.lte("occurred_at", filters.toDate);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const items = ((data ?? []) as unknown as IncidentRow[]).map(mapListItem);
  const total = count ?? 0;

  return {
    items,
    page,
    hasMore: to + 1 < total,
  };
}

export async function createIncident(
  userId: string,
  input: CreateIncidentInput,
  photoFiles: File[] = [],
): Promise<CreateIncidentResult | { error: string }> {
  const access = await assertCoachProgramAccess(userId, input.programId);
  if (!access.ok) {
    return { error: access.error };
  }

  const service = createServiceClient();
  const { data: org } = await service
    .from("organizations")
    .select("org_type")
    .eq("id", access.orgId)
    .maybeSingle();

  const template = templateById(org?.org_type ?? null, input.incidentType);
  if (!template) {
    return { error: "invalid_type" };
  }

  const enrolled = await loadEnrolledForPrograms([input.programId]);
  const childOnRoster = enrolled.some((e) => e.child_id === input.childId);
  if (!childOnRoster) {
    return { error: "child_not_on_roster" };
  }

  if (!input.location.trim() || !input.symptoms.trim() || !input.actionTaken.trim()) {
    return { error: "required_fields" };
  }

  if (template.requiresBodyMap && !input.bodyArea?.trim()) {
    return { error: "body_area_required" };
  }

  const stagedAt = new Date().toISOString();
  const notificationPriority = template.isRedFlag ? "priority" : "standard";

  const { data: incident, error: insertError } = await incidentsTable(service)
    .insert({
      org_id: access.orgId,
      program_id: input.programId,
      child_id: input.childId,
      reported_by: userId,
      incident_type: input.incidentType,
      severity: template.severity,
      is_red_flag: template.isRedFlag,
      occurred_at: input.occurredAt,
      location: input.location.trim(),
      mechanism: input.mechanism.trim() || null,
      body_area: input.bodyArea?.trim() || null,
      symptoms: input.symptoms.trim(),
      pain_level: input.painLevel ?? null,
      action_taken: input.actionTaken.trim(),
      witnesses: input.witnesses,
      status: "submitted",
      notification_staged_at: stagedAt,
      notification_priority: notificationPriority,
    })
    .select("id")
    .single();

  if (insertError || !incident) {
    return { error: "create_failed" };
  }

  await incidentAuditLogTable(service).insert({
    incident_id: incident.id,
    actor_id: userId,
    action: "created",
    metadata: { incidentType: input.incidentType, isRedFlag: template.isRedFlag },
  });

  for (const file of photoFiles) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > MAX_INCIDENT_PHOTO_BYTES) continue;

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `incidents/${access.orgId}/${incident.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from(INCIDENT_PHOTOS_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (!uploadError) {
      await incidentPhotosTable(service).insert({
        incident_id: incident.id,
        storage_path: path,
        uploaded_by: userId,
      });
    }
  }

  const child = enrolled.find((e) => e.child_id === input.childId);
  const typeLabel = input.incidentType.replace(/_/g, " ");

  await timelineEventsTable(service).insert({
    child_id: input.childId,
    org_id: access.orgId,
    program_id: input.programId,
    event_type: "incident",
    title: template.isRedFlag ? `Urgent: ${typeLabel}` : `Incident: ${typeLabel}`,
    summary: input.symptoms.trim().slice(0, 200),
    metadata: {
      incidentId: incident.id,
      severity: template.severity,
      isRedFlag: template.isRedFlag,
    },
    occurred_at: input.occurredAt,
    created_by: userId,
  });

  await enqueueJob({
    type: "incident_notify_parent",
    payload: {
      incidentId: incident.id,
      childId: input.childId,
      parentId: child?.parent_id,
      priority: template.isRedFlag ? "high" : "standard",
      programName: access.programName,
    },
    idempotencyKey: `incident-notify-${incident.id}`,
  });

  if (template.isRedFlag) {
    void processBackgroundJobs(3).catch(() => undefined);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const notifiedAt = new Date().toISOString();
    await incidentsTable(service)
      .update({
        parent_notified_at: notifiedAt,
        updated_at: notifiedAt,
      })
      .eq("id", incident.id);
    await incidentAuditLogTable(service).insert({
      incident_id: incident.id,
      actor_id: null,
      action: "parent_notified",
      metadata: { channel: "dev_simulated", priority: notificationPriority },
    });
  }

  return {
    incidentId: incident.id,
    isRedFlag: template.isRedFlag,
    parentNotifiedStagedAt: stagedAt,
  };
}
