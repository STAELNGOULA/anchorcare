import type { ParentPlan } from "@/lib/parent/parent-context";
import { FREE_REPORT_HISTORY_MS } from "@/lib/parent/report-detail-constants";
import {
  decodeTimelineCursor,
  encodeTimelineCursor,
  freeTimelineCutoffIso,
  TIMELINE_FILTER_TYPES,
  TIMELINE_PAGE_SIZE,
  type TimelineFilter,
} from "@/lib/parent/timeline-constants";
import type {
  TimelineChildOption,
  TimelineEventItem,
  TimelineEventType,
  TimelinePage,
} from "@/lib/parent/timeline-types";
import { timelineEventsTable } from "@/lib/reports/table-utils";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PHOTO_BUCKET = "child-photos";
const SIGNED_URL_TTL = 3600;

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
};

type TimelineRow = {
  id: string;
  child_id: string;
  org_id: string;
  program_id: string | null;
  daily_report_id: string | null;
  report_child_id: string | null;
  event_type: string;
  title: string;
  summary: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

function isEventLocked(plan: ParentPlan, occurredAt: string): boolean {
  if (plan === "family") return false;
  const cutoff = Date.now() - FREE_REPORT_HISTORY_MS;
  return new Date(occurredAt).getTime() < cutoff;
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

function eventHref(event: TimelineRow): string | null {
  switch (event.event_type) {
    case "daily_report":
      return event.daily_report_id
        ? `/parent/today/${event.child_id}/${event.daily_report_id}`
        : null;
    case "photo":
      return event.daily_report_id
        ? `/parent/today/${event.child_id}/${event.daily_report_id}`
        : null;
    case "incident": {
      const incidentId =
        typeof event.metadata?.incidentId === "string"
          ? event.metadata.incidentId
          : null;
      return incidentId
        ? `/parent/incidents/${incidentId}`
        : `/parent/timeline?childId=${event.child_id}&filter=incidents`;
    }
    case "registration":
      return "/parent/programs/enrolled";
    case "note":
      return null;
    case "visit_report": {
      const visitReportId =
        typeof event.metadata?.visitReportId === "string"
          ? event.metadata.visitReportId
          : null;
      return visitReportId
        ? `/parent/care/visits/${visitReportId}`
        : "/parent/care/visits";
    }
    default:
      return null;
  }
}

function mapEvent(
  row: TimelineRow,
  childName: string,
  programName: string | null,
  orgName: string | null,
  plan: ParentPlan,
): TimelineEventItem {
  const locked = isEventLocked(plan, row.occurred_at);
  const [firstName] = childName.split(" ");

  return {
    id: row.id,
    childId: row.child_id,
    childFirstName: firstName ?? childName,
    eventType: row.event_type as TimelineEventType,
    title: locked ? row.title : row.title,
    summary: locked ? null : row.summary,
    occurredAt: row.occurred_at,
    programId: row.program_id,
    programName,
    orgName,
    dailyReportId: row.daily_report_id,
    reportChildId: row.report_child_id,
    locked,
    href: locked ? null : eventHref(row),
  };
}

export async function getParentTimelinePage(
  parentId: string,
  plan: ParentPlan,
  options: {
    childId?: string | null;
    filter?: TimelineFilter;
    cursor?: string | null;
    limit?: number;
  } = {},
): Promise<TimelinePage> {
  const supabase = await createClient();
  const filter = options.filter ?? "all";
  const limit = options.limit ?? TIMELINE_PAGE_SIZE;

  const { data: childRows } = await supabase
    .from("children")
    .select("id, first_name, last_name, photo_url")
    .order("created_at", { ascending: true });

  const children = (childRows ?? []) as ChildRow[];
  const childIds = children.map((c) => c.id);

  const childOptions: TimelineChildOption[] = await Promise.all(
    children.map(async (c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      photoSignedUrl: await signedChildPhoto(c.photo_url),
    })),
  );

  if (childIds.length === 0) {
    return {
      children: [],
      events: [],
      nextCursor: null,
      plan,
      freeWindowCutoff: freeTimelineCutoffIso(),
      filter,
      childId: options.childId ?? null,
    };
  }

  const scopedChildIds =
    options.childId && childIds.includes(options.childId)
      ? [options.childId]
      : childIds;

  let query = timelineEventsTable(supabase)
    .select(
      "id, child_id, org_id, program_id, daily_report_id, report_child_id, event_type, title, summary, occurred_at, metadata",
    )
    .in("child_id", scopedChildIds)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  const typeFilter = TIMELINE_FILTER_TYPES[filter];
  if (typeFilter) {
    query = query.in("event_type", typeFilter);
  }

  const parsed = options.cursor ? decodeTimelineCursor(options.cursor) : null;
  if (parsed) {
    query = query.or(
      `and(occurred_at.eq.${parsed.occurredAt},id.lt.${parsed.id}),occurred_at.lt.${parsed.occurredAt}`,
    );
  }

  const { data: rows } = await query;
  const allRows = (rows ?? []) as TimelineRow[];
  const hasMore = allRows.length > limit;
  const pageRows = hasMore ? allRows.slice(0, limit) : allRows;

  const programIds = [
    ...new Set(pageRows.map((r) => r.program_id).filter(Boolean)),
  ] as string[];
  const orgIds = [...new Set(pageRows.map((r) => r.org_id))];

  const programMap = new Map<string, string>();
  const orgMap = new Map<string, string>();

  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name")
      .in("id", programIds);
    for (const p of programs ?? []) {
      programMap.set(p.id, p.name);
    }
  }

  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, public_headline")
      .in("id", orgIds);
    for (const o of orgs ?? []) {
      orgMap.set(
        o.id,
        (o as { public_headline?: string | null }).public_headline ??
          o.name,
      );
    }
  }

  const childNameMap = new Map(
    children.map((c) => [
      c.id,
      `${c.first_name} ${c.last_name}`.trim(),
    ]),
  );

  const events = pageRows.map((row) =>
    mapEvent(
      row,
      childNameMap.get(row.child_id) ?? "Child",
      row.program_id ? programMap.get(row.program_id) ?? null : null,
      orgMap.get(row.org_id) ?? null,
      plan,
    ),
  );

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeTimelineCursor(last.occurred_at, last.id)
      : null;

  return {
    children: childOptions,
    events,
    nextCursor,
    plan,
    freeWindowCutoff: freeTimelineCutoffIso(),
    filter,
    childId: options.childId ?? null,
  };
}
