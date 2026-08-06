import type { ParentPlan } from "@/lib/parent/parent-context";
import { FREE_REPORT_HISTORY_MS } from "@/lib/parent/report-detail-constants";
import type {
  ReportDetailPhoto,
  ReportDetailResult,
} from "@/lib/parent/report-detail-types";
import {
  reportChildrenTable,
  reportsTable,
  timelineEventsTable,
} from "@/lib/reports/table-utils";
import { createClient } from "@/lib/supabase/server";

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
};

type TimelineRow = {
  id: string;
  daily_report_id: string | null;
  report_child_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  program_id: string | null;
};

type ReportChildRow = {
  id: string;
  daily_report_id: string;
  published_text: string | null;
  transcript: string | null;
  photo_count: number;
  status: string;
};

type DailyReportRow = {
  id: string;
  program_id: string;
  org_id: string;
  report_date: string;
  status: string;
  transcript: string | null;
  published_at: string | null;
  published_by: string | null;
};

function isWithinFreeWindow(reportDate: string): boolean {
  const reportMs = new Date(`${reportDate}T12:00:00`).getTime();
  return Date.now() - reportMs <= FREE_REPORT_HISTORY_MS;
}

function canAccessReport(plan: ParentPlan, reportDate: string): boolean {
  if (plan === "family") return true;
  return isWithinFreeWindow(reportDate);
}

function coachNotesFromMetadata(
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null;
  const raw = metadata.coachNotes ?? metadata.coach_notes;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function photosFromMetadata(
  metadata: Record<string, unknown> | null,
): ReportDetailPhoto[] {
  if (!metadata || !Array.isArray(metadata.photos)) return [];
  return metadata.photos
    .filter(
      (item): item is { id?: string; url: string; alt?: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { url?: string }).url === "string",
    )
    .map((item, index) => ({
      id: item.id ?? `photo-${index}`,
      signedUrl: item.url,
      alt: item.alt ?? "",
    }));
}

function sanitizeShareText(text: string): string {
  return text
    .replace(/\b(allerg(y|ies)|medication|epipen|asthma|diagnosis)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function getParentReportDetail(
  parentId: string,
  plan: ParentPlan,
  childId: string,
  reportId: string,
  options?: { shareMode?: boolean },
): Promise<ReportDetailResult> {
  const supabase = await createClient();
  const shareMode = options?.shareMode ?? false;

  const { data: child } = await supabase
    .from("children")
    .select("id, first_name, last_name, parent_id")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!child) {
    return { state: "unavailable", reason: "forbidden" };
  }

  const childRow = child as ChildRow;

  let dailyReportId = reportId;
  let timelineEventId: string | null = null;
  let timelineMeta: Record<string, unknown> | null = null;
  let timelineProgramId: string | null = null;

  const { data: directReport } = await reportsTable(supabase)
    .select("id, status")
    .eq("id", reportId)
    .maybeSingle();

  if (!directReport) {
    const { data: event } = await timelineEventsTable(supabase)
      .select(
        "id, daily_report_id, report_child_id, summary, metadata, occurred_at, program_id",
      )
      .eq("child_id", childId)
      .or(`daily_report_id.eq.${reportId},id.eq.${reportId}`)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!event) {
      return { state: "unavailable", reason: "not_found" };
    }

    const timeline = event as TimelineRow;
    if (!timeline.daily_report_id) {
      return { state: "unavailable", reason: "not_found" };
    }

    dailyReportId = timeline.daily_report_id;
    timelineEventId = timeline.id;
    timelineMeta = timeline.metadata;
    timelineProgramId = timeline.program_id;
  }

  const { data: report } = await reportsTable(supabase)
    .select(
      "id, program_id, org_id, report_date, status, transcript, published_at, published_by",
    )
    .eq("id", dailyReportId)
    .maybeSingle();

  if (!report) {
    return { state: "unavailable", reason: "not_found" };
  }

  const reportRow = report as DailyReportRow;
  if (reportRow.status !== "published") {
    return { state: "unavailable", reason: "not_published" };
  }

  if (!canAccessReport(plan, reportRow.report_date)) {
    const [{ data: program }, { data: org }] = await Promise.all([
      supabase
        .from("programs")
        .select("name")
        .eq("id", reportRow.program_id)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("name, public_headline")
        .eq("id", reportRow.org_id)
        .maybeSingle(),
    ]);

    return {
      state: "paywalled",
      childFirstName: childRow.first_name,
      reportDate: reportRow.report_date,
      programName: program?.name ?? "Program",
      orgName: org?.public_headline ?? org?.name ?? "Program",
    };
  }

  const { data: reportChild } = await reportChildrenTable(supabase)
    .select(
      "id, daily_report_id, published_text, transcript, photo_count, status",
    )
    .eq("daily_report_id", dailyReportId)
    .eq("child_id", childId)
    .eq("status", "published")
    .maybeSingle();

  if (!reportChild) {
    return { state: "unavailable", reason: "not_found" };
  }

  const childReport = reportChild as ReportChildRow;
  const programId = timelineProgramId ?? reportRow.program_id;

  const [{ data: program }, { data: org }, { data: coachProfile }] =
    await Promise.all([
      supabase.from("programs").select("name").eq("id", programId).maybeSingle(),
      supabase
        .from("organizations")
        .select("name, public_headline, brand_accent_color")
        .eq("id", reportRow.org_id)
        .maybeSingle(),
      reportRow.published_by
        ? supabase
            .from("profiles")
            .select("full_name")
            .eq("id", reportRow.published_by)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const reportBody = childReport.published_text?.trim() ?? "";
  const coachNotes = shareMode
    ? null
    : coachNotesFromMetadata(timelineMeta);
  const transcript = shareMode
    ? null
    : childReport.transcript ?? reportRow.transcript;
  const photos = shareMode ? [] : photosFromMetadata(timelineMeta);

  const amendedAt =
    typeof timelineMeta?.amendedAt === "string"
      ? timelineMeta.amendedAt
      : typeof timelineMeta?.amended_at === "string"
        ? timelineMeta.amended_at
        : null;

  return {
    state: "valid",
    childId,
    childFirstName: childRow.first_name,
    childLastName: shareMode ? "" : childRow.last_name,
    dailyReportId: reportRow.id,
    reportChildId: childReport.id,
    timelineEventId,
    reportDate: reportRow.report_date,
    programId,
    programName: program?.name ?? "Program",
    orgName: org?.public_headline ?? org?.name ?? "Program",
    orgAccentColor: org?.brand_accent_color ?? "#4ECDC4",
    reportBody: shareMode ? sanitizeShareText(reportBody) : reportBody,
    coachNotes,
    transcript,
    photos,
    photoCount: childReport.photo_count,
    coachName: shareMode
      ? null
      : coachProfile?.full_name?.trim() ?? null,
    publishedAt: reportRow.published_at,
    amendedAt,
    shareSafe: shareMode,
  };
}
