import type {
  ParentTodayFeed,
  TodayChildCard,
  TodayFormExpiryAlert,
  TodayIncidentAlert,
  TodayReportSnippet,
  EngagementEventType,
} from "@/lib/parent/today-types";
import { listExpiringFormsForParent } from "@/lib/forms/form-service";
import { listTodayHealthChecksForChildren } from "@/lib/health/health-check-service";
import { listActivePickupEtas } from "@/lib/pickups/pickup-eta-service";
import { timelineEventsTable } from "@/lib/reports/table-utils";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PHOTO_BUCKET = "child-photos";
const SIGNED_URL_TTL = 3600;
const INCIDENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  parent_id: string;
};

type RegistrationRow = {
  child_id: string;
  program_id: string;
  status: string;
};

type TimelineRow = {
  id: string;
  child_id: string;
  event_type: string;
  title: string;
  summary: string | null;
  occurred_at: string;
  daily_report_id: string | null;
  report_child_id: string | null;
  metadata: Record<string, unknown> | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engagementTable(client: { from: (table: string) => any }): any {
  return client.from("parent_engagement_events" as "program_registrations");
}

function formatDateLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

async function signedChildPhoto(
  photoPath: string | null,
): Promise<string | null> {
  if (!photoPath) return null;
  try {
    const service = createServiceClient();
    const { data, error } = await service.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(photoPath, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

async function photoCountForReportChild(
  reportChildId: string | null,
): Promise<number> {
  if (!reportChildId) return 0;
  const service = createServiceClient();
  const { data } = await service
    .from("report_children" as "program_registrations")
    .select("photo_count")
    .eq("id", reportChildId)
    .maybeSingle();
  return (data as { photo_count?: number } | null)?.photo_count ?? 0;
}

function mapReportEvent(
  row: TimelineRow,
  photoCount: number,
): TodayReportSnippet {
  return {
    eventId: row.id,
    reportChildId: row.report_child_id,
    dailyReportId: row.daily_report_id,
    summary: row.summary,
    occurredAt: row.occurred_at,
    photoCount,
  };
}

function mapIncident(row: TimelineRow): TodayIncidentAlert {
  const incidentId =
    typeof row.metadata?.incidentId === "string" ? row.metadata.incidentId : null;
  return {
    eventId: row.id,
    incidentId,
    title: row.title,
    summary: row.summary,
    occurredAt: row.occurred_at,
  };
}

export async function getParentTodayFeed(
  parentId: string,
  displayName: string,
): Promise<ParentTodayFeed> {
  const supabase = await createClient();

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("last_today_visit_at")
    .eq("id", parentId)
    .maybeSingle();

  const lastVisitAt =
    (profile as { last_today_visit_at?: string | null } | null)
      ?.last_today_visit_at ?? null;
  const lastVisitMs = lastVisitAt ? new Date(lastVisitAt).getTime() : 0;

  const { data: childRows } = await supabase
    .from("children")
    .select("id, first_name, last_name, photo_url, parent_id")
    .order("created_at", { ascending: true });

  const children = (childRows ?? []) as ChildRow[];
  const childIds = children.map((c) => c.id);

  if (childIds.length === 0) {
    const { count: regCount } = await supabase
      .from("program_registrations")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", parentId);

    return {
      greetingName: displayName,
      dateLabel: formatDateLabel(),
      lastVisitAt,
      children: [],
      formExpiryAlerts: [],
      hasPrograms: (regCount ?? 0) > 0,
      hasChildren: false,
    };
  }

  const [pickupEtas, formExpiryAlerts, morningHealthChecks] = await Promise.all([
    listActivePickupEtas(parentId, childIds),
    listExpiringFormsForParent(parentId, 30),
    listTodayHealthChecksForChildren(childIds),
  ]);

  const healthByChild = new Map(
    morningHealthChecks.map((h) => [h.childId, h]),
  );

  const { data: registrations } = await supabase
    .from("program_registrations")
    .select("child_id, program_id, status")
    .in("child_id", childIds)
    .in("status", ["active", "pending"])
    .order("updated_at", { ascending: false });

  const regByChild = new Map<string, RegistrationRow>();
  for (const row of (registrations ?? []) as RegistrationRow[]) {
    if (!regByChild.has(row.child_id)) {
      regByChild.set(row.child_id, row);
    }
  }

  const programIds = [
    ...new Set(
      (registrations ?? []).map((r: RegistrationRow) => r.program_id),
    ),
  ];

  const programMap = new Map<string, string>();
  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name")
      .in("id", programIds);
    for (const p of programs ?? []) {
      programMap.set(p.id, p.name);
    }
  }

  const timeline = timelineEventsTable(supabase);
  const { data: events } = await timeline
    .select(
      "id, child_id, event_type, title, summary, occurred_at, daily_report_id, report_child_id, metadata",
    )
    .in("child_id", childIds)
    .order("occurred_at", { ascending: false })
    .limit(200);

  const eventsByChild = new Map<string, TimelineRow[]>();
  for (const row of (events ?? []) as TimelineRow[]) {
    const list = eventsByChild.get(row.child_id) ?? [];
    list.push(row);
    eventsByChild.set(row.child_id, list);
  }

  const now = Date.now();
  const cards: TodayChildCard[] = [];

  for (const child of children) {
    const photoSignedUrl = await signedChildPhoto(child.photo_url);
    const reg = regByChild.get(child.id);
    const programId = reg?.program_id ?? null;
    const programName = programId ? programMap.get(programId) ?? null : null;
    const childEvents = eventsByChild.get(child.id) ?? [];

    const incidentRow = childEvents.find(
      (e) =>
        e.event_type === "incident" &&
        now - new Date(e.occurred_at).getTime() < INCIDENT_WINDOW_MS,
    );

    const reportRow = childEvents.find(
      (e) => e.event_type === "daily_report" || e.event_type === "photo",
    );

    let latestReport: TodayReportSnippet | null = null;
    if (reportRow && reportRow.event_type === "daily_report") {
      const photoCount = await photoCountForReportChild(
        reportRow.report_child_id,
      );
      latestReport = mapReportEvent(reportRow, photoCount);
    } else if (reportRow) {
      latestReport = mapReportEvent(reportRow, 1);
    }

    const isNew =
      latestReport != null &&
      new Date(latestReport.occurredAt).getTime() > lastVisitMs;

    const eta = pickupEtas.get(child.id);
    const health = healthByChild.get(child.id);

    cards.push({
      childId: child.id,
      firstName: child.first_name,
      lastName: child.last_name,
      photoSignedUrl,
      programId,
      programName,
      registrationStatus:
        (reg?.status as TodayChildCard["registrationStatus"]) ?? null,
      latestReport,
      incidentAlert: incidentRow ? mapIncident(incidentRow) : null,
      pickupEta: eta
        ? {
            id: eta.id,
            minutesLate: eta.minutesLate,
            note: eta.note,
            expectedAt: eta.expectedAt,
            programName: eta.programName,
          }
        : null,
      morningHealth: health
        ? {
            healthStatus: health.healthStatus,
            note: health.note,
          }
        : null,
      isNew,
      waitingForFirstReport: Boolean(reg && !latestReport && !incidentRow),
    });
  }

  const expiryAlerts: TodayFormExpiryAlert[] = formExpiryAlerts.map((f) => ({
    formId: f.id,
    title: f.title,
    expiresAt: f.expiresAt!,
    daysUntil: f.daysUntil,
  }));

  return {
    greetingName: displayName,
    dateLabel: formatDateLabel(),
    lastVisitAt,
    children: cards,
    formExpiryAlerts: expiryAlerts,
    hasPrograms: (registrations ?? []).length > 0,
    hasChildren: true,
  };
}

export async function recordParentEngagement(
  parentId: string,
  eventType: EngagementEventType,
  options?: {
    childId?: string;
    timelineEventId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const service = createServiceClient();
  const table = engagementTable(service);

  await table.insert({
    parent_id: parentId,
    event_type: eventType,
    child_id: options?.childId ?? null,
    timeline_event_id: options?.timelineEventId ?? null,
    metadata: options?.metadata ?? {},
  });

  if (eventType === "today_visit") {
    await service
      .from("profiles")
      .update({ last_today_visit_at: new Date().toISOString() } as never)
      .eq("id", parentId);
  }
}
