import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import { enqueueJob } from "@/lib/jobs/queue";
import type {
  AdminChildSearchResult,
  CreateVisitReportInput,
  CreateVisitReportResult,
  VisitReportDetail,
  VisitReportListItem,
} from "@/lib/visits/visit-types";
import { visitReportsTable } from "@/lib/visits/table-utils";
import { timelineEventsTable } from "@/lib/reports/table-utils";
import { createServiceClient } from "@/lib/supabase/service";

const PDF_BUCKET = "visit-reports";
const SIGNED_URL_TTL = 3600;

type VisitRow = {
  id: string;
  child_id: string;
  parent_id: string;
  doctor_id: string | null;
  doctor_name: string;
  appointment_date: string;
  summary: string;
  pdf_storage_path: string | null;
  timeline_event_id: string | null;
  created_at: string;
};

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
};

function summaryPreview(summary: string): string {
  const line = summary.split(/\n/)[0]?.trim() ?? summary;
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

async function signedPdfUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const service = createServiceClient();
    const { data, error } = await service.storage
      .from(PDF_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

async function resolveChildOrgContext(
  childId: string,
): Promise<{ orgId: string; programId: string | null } | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("program_registrations")
    .select("org_id, program_id")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.org_id) return null;
  return { orgId: data.org_id, programId: data.program_id ?? null };
}

async function getChildRow(childId: string): Promise<ChildRow | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("children")
    .select("id, first_name, last_name, parent_id")
    .eq("id", childId)
    .maybeSingle();
  return (data as ChildRow | null) ?? null;
}

function mapListItem(row: VisitRow, childFirstName: string): VisitReportListItem {
  return {
    id: row.id,
    childId: row.child_id,
    childFirstName,
    doctorName: row.doctor_name,
    appointmentDate: row.appointment_date,
    summaryPreview: summaryPreview(row.summary),
    hasPdf: Boolean(row.pdf_storage_path),
  };
}

export async function listVisitReportsForParent(
  parentId: string,
  childId?: string,
): Promise<VisitReportListItem[]> {
  const service = createServiceClient();
  let query = visitReportsTable(service)
    .select(
      "id, child_id, parent_id, doctor_id, doctor_name, appointment_date, summary, pdf_storage_path, timeline_event_id, created_at",
    )
    .eq("parent_id", parentId)
    .order("appointment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data } = await query;
  const rows = (data ?? []) as VisitRow[];
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

  return rows.map((row) =>
    mapListItem(row, nameMap.get(row.child_id) ?? "Child"),
  );
}

export async function getVisitReportForParent(
  parentId: string,
  visitId: string,
): Promise<VisitReportDetail | null> {
  const service = createServiceClient();
  const { data } = await visitReportsTable(service)
    .select("*")
    .eq("id", visitId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!data) return null;

  const row = data as VisitRow;
  const child = await getChildRow(row.child_id);
  const pdfSignedUrl = await signedPdfUrl(row.pdf_storage_path);

  return {
    ...mapListItem(row, child?.first_name ?? "Child"),
    summary: row.summary,
    doctorId: row.doctor_id,
    pdfSignedUrl,
    createdAt: row.created_at,
  };
}

export async function searchChildrenForAdmin(
  query: string,
): Promise<AdminChildSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const service = createServiceClient();
  const { data: children } = await service
    .from("children")
    .select("id, first_name, last_name, parent_id")
    .limit(40);

  const rows = (children ?? []) as ChildRow[];
  const parentIds = [...new Set(rows.map((c) => c.parent_id))];

  const profileMap = new Map<string, string | null>();
  const emailMap = new Map<string, string>();

  await Promise.all(
    parentIds.map(async (parentId) => {
      const [{ data: profile }, { data: authUser }] = await Promise.all([
        service
          .from("profiles")
          .select("full_name")
          .eq("id", parentId)
          .maybeSingle(),
        service.auth.admin.getUserById(parentId),
      ]);
      profileMap.set(parentId, profile?.full_name ?? null);
      if (authUser.user?.email) {
        emailMap.set(parentId, authUser.user.email);
      }
    }),
  );

  const results: AdminChildSearchResult[] = [];

  for (const child of rows) {
    const childName = `${child.first_name} ${child.last_name}`.trim();
    const parentEmail = emailMap.get(child.parent_id) ?? "";
    const parentName = profileMap.get(child.parent_id) ?? null;

    const haystack = `${childName} ${parentEmail} ${parentName ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) continue;

    results.push({
      childId: child.id,
      childName,
      parentId: child.parent_id,
      parentEmail,
      parentName,
    });
    if (results.length >= 20) break;
  }

  return results;
}

export async function createVisitReport(
  adminId: string,
  input: CreateVisitReportInput,
): Promise<CreateVisitReportResult> {
  if (!(await isPlatformAdmin(adminId))) {
    return { ok: false, error: "forbidden" };
  }

  const child = await getChildRow(input.childId);
  if (!child) return { ok: false, error: "child_not_found" };

  const orgContext = await resolveChildOrgContext(input.childId);
  if (!orgContext) {
    return { ok: false, error: "child_not_linked" };
  }

  const service = createServiceClient();

  const { data: existing } = await visitReportsTable(service)
    .select("id, appointment_date")
    .eq("child_id", input.childId)
    .eq("appointment_date", input.appointmentDate)
    .maybeSingle();

  if (existing && !input.forceDuplicate) {
    return {
      ok: false,
      error: "duplicate_date",
      duplicateDate: String(existing.appointment_date),
    };
  }

  const now = new Date().toISOString();
  const occurredAt = new Date(`${input.appointmentDate}T12:00:00.000Z`).toISOString();

  const { data: timelineEvent, error: timelineError } = await timelineEventsTable(
    service,
  )
    .insert({
      child_id: input.childId,
      org_id: orgContext.orgId,
      program_id: orgContext.programId,
      event_type: "visit_report",
      title: `Visit with ${input.doctorName}`,
      summary: summaryPreview(input.summary),
      metadata: { source: "visit_vault" },
      occurred_at: occurredAt,
      created_by: adminId,
      created_at: now,
    })
    .select("id")
    .single();

  if (timelineError || !timelineEvent) {
    return { ok: false, error: "timeline_failed" };
  }

  const { data: visit, error: visitError } = await visitReportsTable(service)
    .insert({
      child_id: input.childId,
      parent_id: child.parent_id,
      doctor_id: input.doctorId ?? null,
      doctor_name: input.doctorName,
      appointment_date: input.appointmentDate,
      summary: input.summary,
      pdf_storage_path: input.pdfStoragePath ?? null,
      timeline_event_id: timelineEvent.id,
      uploaded_by: adminId,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (visitError || !visit) {
    await timelineEventsTable(service).delete().eq("id", timelineEvent.id);
    return { ok: false, error: "create_failed" };
  }

  await timelineEventsTable(service)
    .update({
      metadata: {
        source: "visit_vault",
        visitReportId: visit.id,
      },
    })
    .eq("id", timelineEvent.id);

  await enqueueJob({
    type: "visit_report_notify_parent",
    idempotencyKey: `visit_report_notify:${visit.id}`,
    payload: {
      visitReportId: visit.id,
      parentId: child.parent_id,
      childId: input.childId,
      doctorName: input.doctorName,
    },
  });

  return {
    ok: true,
    visitId: visit.id,
    duplicateWarning: Boolean(existing),
  };
}

export { PDF_BUCKET, SIGNED_URL_TTL };
