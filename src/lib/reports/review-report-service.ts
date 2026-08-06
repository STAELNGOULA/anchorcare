import { AUDIO_STORAGE_BUCKET } from "@/lib/reports/constants";
import {
  generateReportChildDrafts,
  buildStubTranscript,
} from "@/lib/reports/draft-generator";
import { assertCoachCanPublish } from "@/lib/reports/coach-publish-gate";
import { assertOrgCanPublish } from "@/lib/reports/org-publish-gate";
import {
  reportChildrenTable,
  reportsTable,
  serviceClient,
  timelineEventsTable,
  todayDateString,
} from "@/lib/reports/table-utils";
import type { ReportScope } from "@/lib/reports/types";
import { assertCoachProgramAccess } from "@/lib/reports/voice-report-service";
import { enqueueJob } from "@/lib/jobs/queue";
import { countUntaggedMedia } from "@/lib/reports/media-service";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 3600;

export type ReportChildStatus = "draft" | "skipped" | "published" | "flagged";

export type ReportChildDraft = {
  id: string;
  childId: string | null;
  registrationId: string | null;
  mentionedName: string | null;
  firstName: string | null;
  lastName: string | null;
  photoSignedUrl: string | null;
  aiDraftText: string | null;
  draftText: string | null;
  publishedText: string | null;
  transcript: string | null;
  status: ReportChildStatus;
  skippedReason: string | null;
  misassignedFlag: boolean;
  photoCount: number;
  sortOrder: number;
};

export type ReviewWorkspace = {
  reportId: string;
  programId: string;
  programName: string;
  reportDate: string;
  status: string;
  scope: ReportScope;
  audioSignedUrl: string | null;
  audioDurationMs: number | null;
  groupTranscript: string | null;
  publishedAt: string | null;
  children: ReportChildDraft[];
  misassignedCount: number;
  publishableCount: number;
};

type DailyReportRow = {
  id: string;
  program_id: string;
  org_id: string;
  report_date: string;
  status: string;
  scope: string;
  audio_path: string | null;
  audio_duration_ms: number | null;
  transcript: string | null;
  published_at: string | null;
  publish_idempotency_key: string | null;
};

type ReportChildRow = {
  id: string;
  daily_report_id: string;
  child_id: string | null;
  registration_id: string | null;
  mentioned_name: string | null;
  ai_draft_text: string | null;
  draft_text: string | null;
  published_text: string | null;
  transcript: string | null;
  status: string;
  skipped_reason: string | null;
  misassigned_flag: boolean;
  photo_count: number;
  sort_order: number;
};

type EnrolledRow = {
  registration_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  parent_id: string;
};

async function signedAudioUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const service = serviceClient();
  const { data, error } = await service.storage
    .from(AUDIO_STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function signedChildPhoto(
  parentId: string,
  photoPath: string | null,
): Promise<string | null> {
  if (!photoPath) return null;
  const service = serviceClient();
  const { data, error } = await service.storage
    .from("child-photos")
    .createSignedUrl(photoPath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function loadEnrolledChildren(
  programId: string,
): Promise<EnrolledRow[]> {
  const service = serviceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roster = service.from("roster_entries" as "program_registrations") as any;
  const { data } = await roster
    .select(
      "registration_id, child_id, first_name, last_name, photo_url, parent_id",
    )
    .eq("program_id", programId)
    .eq("registration_status", "active");

  return (data ?? []) as EnrolledRow[];
}

export async function ensureReportChildDrafts(
  reportId: string,
  programId: string,
  programName: string,
): Promise<void> {
  const service = serviceClient();
  const childTable = reportChildrenTable(service);

  const { count } = await childTable
    .select("id", { count: "exact", head: true })
    .eq("daily_report_id", reportId);

  if ((count ?? 0) > 0) return;

  const enrolled = await loadEnrolledChildren(programId);
  const transcript = buildStubTranscript(
    enrolled.map((row) => ({
      childId: row.child_id,
      registrationId: row.registration_id,
      firstName: row.first_name,
      lastName: row.last_name,
    })),
  );

  await reportsTable(service)
    .update({ transcript, status: "review", updated_at: new Date().toISOString() })
    .eq("id", reportId);

  const drafts = generateReportChildDrafts(
    enrolled.map((row) => ({
      childId: row.child_id,
      registrationId: row.registration_id,
      firstName: row.first_name,
      lastName: row.last_name,
    })),
    programName,
    transcript,
  );

  if (drafts.length === 0) return;

  await childTable.insert(
    drafts.map((draft) => ({
      daily_report_id: reportId,
      child_id: draft.childId,
      registration_id: draft.registrationId,
      mentioned_name: draft.mentionedName,
      ai_draft_text: draft.aiDraftText,
      draft_text: draft.draftText,
      transcript: draft.transcript,
      misassigned_flag: draft.misassignedFlag,
      status: draft.status,
      sort_order: draft.sortOrder,
    })),
  );
}

function mapChildRow(
  row: ReportChildRow,
  childMeta: { firstName: string; lastName: string; photoSignedUrl: string | null },
): ReportChildDraft {
  return {
    id: row.id,
    childId: row.child_id,
    registrationId: row.registration_id,
    mentionedName: row.mentioned_name,
    firstName: childMeta.firstName ?? row.mentioned_name,
    lastName: childMeta.lastName,
    photoSignedUrl: childMeta.photoSignedUrl,
    aiDraftText: row.ai_draft_text,
    draftText: row.draft_text,
    publishedText: row.published_text,
    transcript: row.transcript,
    status: row.status as ReportChildStatus,
    skippedReason: row.skipped_reason,
    misassignedFlag: row.misassigned_flag,
    photoCount: row.photo_count,
    sortOrder: row.sort_order,
  };
}

export async function getReviewWorkspace(
  userId: string,
  programId: string,
): Promise<{ ok: true; workspace: ReviewWorkspace } | { ok: false; error: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const reportDate = todayDateString();
  const supabase = await createClient();

  const { data: report } = await reportsTable(supabase)
    .select(
      "id, program_id, org_id, report_date, status, scope, audio_path, audio_duration_ms, transcript, published_at, publish_idempotency_key",
    )
    .eq("program_id", programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (!report) {
    return { ok: false, error: "No report for today — record voice first" };
  }

  const reportRow = report as DailyReportRow;

  if (reportRow.status !== "review" && reportRow.status !== "published") {
    if (reportRow.status === "transcribing") {
      return { ok: false, error: "Transcription in progress — check back shortly" };
    }
    return { ok: false, error: "Report not ready for review" };
  }

  await ensureReportChildDrafts(reportRow.id, programId, access.programName);

  const { data: childRows } = await reportChildrenTable(supabase)
    .select(
      "id, daily_report_id, child_id, registration_id, mentioned_name, ai_draft_text, draft_text, published_text, transcript, status, skipped_reason, misassigned_flag, photo_count, sort_order",
    )
    .eq("daily_report_id", reportRow.id)
    .order("sort_order", { ascending: true });

  const enrolled = await loadEnrolledChildren(programId);
  const enrolledByChildId = new Map(
    enrolled.map((row) => [row.child_id, row]),
  );

  const children: ReportChildDraft[] = [];
  for (const row of (childRows ?? []) as ReportChildRow[]) {
    const meta = row.child_id ? enrolledByChildId.get(row.child_id) : null;
    const photoSignedUrl = meta
      ? await signedChildPhoto(meta.parent_id, meta.photo_url)
      : null;
    children.push(
      mapChildRow(row, {
        firstName: meta?.first_name ?? row.mentioned_name ?? "",
        lastName: meta?.last_name ?? "",
        photoSignedUrl,
      }),
    );
  }

  const misassignedCount = children.filter(
    (c) =>
      (c.misassignedFlag || c.status === "flagged") && c.status !== "skipped",
  ).length;

  const publishableCount = children.filter(
    (c) =>
      c.status !== "skipped" &&
      c.status !== "published" &&
      !c.misassignedFlag &&
      (c.draftText?.trim().length ?? 0) > 0,
  ).length;

  const audioSignedUrl = await signedAudioUrl(reportRow.audio_path);

  return {
    ok: true,
    workspace: {
      reportId: reportRow.id,
      programId,
      programName: access.programName,
      reportDate: reportRow.report_date,
      status: reportRow.status,
      scope: reportRow.scope as ReportScope,
      audioSignedUrl,
      audioDurationMs: reportRow.audio_duration_ms,
      groupTranscript: reportRow.transcript,
      publishedAt: reportRow.published_at,
      children,
      misassignedCount,
      publishableCount,
    },
  };
}

export type SaveDraftInput = {
  id: string;
  draftText?: string;
  status?: ReportChildStatus;
  skippedReason?: string | null;
  misassignedFlag?: boolean;
};

export async function saveReportDrafts(
  userId: string,
  programId: string,
  updates: SaveDraftInput[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const reportDate = todayDateString();
  const service = serviceClient();

  const { data: report } = await reportsTable(service)
    .select("id, status")
    .eq("program_id", programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (!report) return { ok: false, error: "Report not found" };
  if ((report as { status: string }).status === "published") {
    return { ok: false, error: "Report already published" };
  }

  const reportId = (report as { id: string }).id;
  const childTable = reportChildrenTable(service);

  for (const update of updates) {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (update.draftText !== undefined) patch.draft_text = update.draftText;
    if (update.status !== undefined) patch.status = update.status;
    if (update.skippedReason !== undefined) {
      patch.skipped_reason = update.skippedReason;
    }
    if (update.misassignedFlag !== undefined) {
      patch.misassigned_flag = update.misassignedFlag;
      if (update.misassignedFlag) patch.status = "flagged";
    }

    await childTable
      .update(patch)
      .eq("id", update.id)
      .eq("daily_report_id", reportId);
  }

  return { ok: true };
}

export type PublishResult = {
  reportId: string;
  publishedCount: number;
  skippedCount: number;
  alreadyPublished: boolean;
};

export async function publishDailyReport(
  userId: string,
  programId: string,
  idempotencyKey: string,
): Promise<{ ok: true; result: PublishResult } | { ok: false; error: string; code?: string }> {
  const access = await assertCoachCanPublish(userId, programId);
  if (!access.ok) return { ok: false, error: access.error, code: access.code };

  const gate = await assertOrgCanPublish(access.orgId);
  if (!gate.ok) {
    return { ok: false, error: gate.error, code: gate.code };
  }

  const reportDate = todayDateString();
  const service = serviceClient();

  const { data: report } = await reportsTable(service)
    .select(
      "id, program_id, org_id, report_date, status, publish_idempotency_key, published_at",
    )
    .eq("program_id", programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (!report) return { ok: false, error: "Report not found" };

  const reportRow = report as DailyReportRow;

  if (
    reportRow.publish_idempotency_key === idempotencyKey &&
    reportRow.status === "published"
  ) {
    const { data: publishedRows } = await reportChildrenTable(service)
      .select("id, status")
      .eq("daily_report_id", reportRow.id);

    const rows = (publishedRows ?? []) as { status: string }[];
    return {
      ok: true,
      result: {
        reportId: reportRow.id,
        publishedCount: rows.filter((r) => r.status === "published").length,
        skippedCount: rows.filter((r) => r.status === "skipped").length,
        alreadyPublished: true,
      },
    };
  }

  if (reportRow.status === "published") {
    return { ok: false, error: "Report already published with a different token" };
  }

  const untagged = await countUntaggedMedia(reportRow.id);
  if (untagged > 0) {
    return {
      ok: false,
      error: "Tag all uploaded photos before publishing reports",
      code: "untagged_media",
    };
  }

  const { data: childRows } = await reportChildrenTable(service)
    .select(
      "id, child_id, draft_text, status, misassigned_flag, mentioned_name",
    )
    .eq("daily_report_id", reportRow.id);

  const rows = (childRows ?? []) as ReportChildRow[];
  const misassigned = rows.filter(
    (r) =>
      (r.misassigned_flag || r.status === "flagged") && r.status !== "skipped",
  );
  if (misassigned.length > 0) {
    return {
      ok: false,
      error: "Resolve misassigned mentions before publishing",
      code: "misassigned_pending",
    };
  }

  const now = new Date().toISOString();
  let publishedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    if (row.status === "skipped") {
      skippedCount += 1;
      continue;
    }

    if (!row.child_id) continue;

    const text = row.draft_text?.trim();
    if (!text) {
      await reportChildrenTable(service)
        .update({ status: "skipped", skipped_reason: "empty_draft", updated_at: now })
        .eq("id", row.id);
      skippedCount += 1;
      continue;
    }

    await reportChildrenTable(service)
      .update({
        published_text: text,
        status: "published",
        updated_at: now,
      })
      .eq("id", row.id);

    await timelineEventsTable(service).insert({
      child_id: row.child_id,
      org_id: reportRow.org_id,
      program_id: programId,
      daily_report_id: reportRow.id,
      report_child_id: row.id,
      event_type: "daily_report",
      title: "Daily report",
      summary: text.slice(0, 280),
      metadata: { reportDate: reportRow.report_date },
      occurred_at: now,
      created_by: userId,
    });

    publishedCount += 1;
  }

  await reportsTable(service)
    .update({
      status: "published",
      published_at: now,
      published_by: userId,
      publish_idempotency_key: idempotencyKey,
      updated_at: now,
    })
    .eq("id", reportRow.id);

  await enqueueJob({
    type: "notify_parents",
    payload: { reportId: reportRow.id, programId },
    idempotencyKey: `notify-parents-${reportRow.id}`,
  });

  await enqueueJob({
    type: "generate_sms_tokens",
    payload: { reportId: reportRow.id, programId },
    idempotencyKey: `sms-tokens-${reportRow.id}`,
  });

  return {
    ok: true,
    result: {
      reportId: reportRow.id,
      publishedCount,
      skippedCount,
      alreadyPublished: false,
    },
  };
}

export async function discardReportDrafts(
  userId: string,
  programId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const reportDate = todayDateString();
  const service = serviceClient();

  const { data: report } = await reportsTable(service)
    .select("id, status")
    .eq("program_id", programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (!report) return { ok: false, error: "Report not found" };
  if ((report as { status: string }).status === "published") {
    return { ok: false, error: "Cannot discard a published report" };
  }

  const reportId = (report as { id: string }).id;

  await reportChildrenTable(service)
    .delete()
    .eq("daily_report_id", reportId);

  await reportsTable(service)
    .update({
      status: "draft",
      transcript: null,
      publish_idempotency_key: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  return { ok: true };
}
