import {
  AUDIO_STORAGE_BUCKET,
  MAX_AUDIO_BYTES,
  MAX_VOICE_DURATION_MS,
} from "@/lib/reports/constants";
import type { ReportScope, VoiceDraftSummary } from "@/lib/reports/types";
import { reportsTable, todayDateString } from "@/lib/reports/table-utils";
import { enqueueJob } from "@/lib/jobs/queue";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type DailyReportRow = {
  id: string;
  program_id: string;
  org_id: string;
  recorded_by: string;
  report_date: string;
  status: string;
  scope: string;
  audio_path: string | null;
  audio_duration_ms: number | null;
  audio_mime_type: string | null;
  upload_status: string;
  upload_error: string | null;
  created_at: string;
  updated_at: string;
};

function mapDraft(row: DailyReportRow): VoiceDraftSummary {
  return {
    id: row.id,
    programId: row.program_id,
    reportDate: row.report_date,
    status: row.status as VoiceDraftSummary["status"],
    scope: row.scope as ReportScope,
    audioDurationMs: row.audio_duration_ms,
    uploadStatus: row.upload_status as VoiceDraftSummary["uploadStatus"],
    uploadError: row.upload_error,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function audioExtension(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export async function assertCoachProgramAccess(
  userId: string,
  programId: string,
): Promise<
  | { ok: true; orgId: string; programName: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .maybeSingle();

  const { data: program } = await supabase
    .from("programs")
    .select("id, name, org_id")
    .eq("id", programId)
    .maybeSingle();

  if (!program) {
    return { ok: false, error: "Program not found" };
  }

  if (!assignment) {
    const { data: member } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", program.org_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!member) {
      return { ok: false, error: "Forbidden" };
    }
  }

  return { ok: true, orgId: program.org_id, programName: program.name };
}

export async function getTodayVoiceDraft(
  programId: string,
): Promise<VoiceDraftSummary | null> {
  const supabase = await createClient();
  const reportDate = todayDateString();

  const { data } = await reportsTable(supabase)
    .select(
      "id, program_id, org_id, recorded_by, report_date, status, scope, audio_duration_ms, upload_status, upload_error, created_at, updated_at",
    )
    .eq("program_id", programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (!data) return null;
  return mapDraft(data as DailyReportRow);
}

export type UploadVoiceInput = {
  userId: string;
  programId: string;
  file: File;
  durationMs: number;
  scope: ReportScope;
};

export type UploadVoiceResult =
  | { ok: true; draft: VoiceDraftSummary }
  | { ok: false; error: string };

export async function uploadVoiceRecording(
  input: UploadVoiceInput,
): Promise<UploadVoiceResult> {
  const access = await assertCoachProgramAccess(input.userId, input.programId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  if (input.durationMs <= 0 || input.durationMs > MAX_VOICE_DURATION_MS) {
    return { ok: false, error: "Invalid recording duration" };
  }

  if (!input.file.type.startsWith("audio/")) {
    return { ok: false, error: "Invalid audio format" };
  }

  if (input.file.size > MAX_AUDIO_BYTES) {
    return { ok: false, error: "Recording too large" };
  }

  const reportDate = todayDateString();
  const service = createServiceClient();
  const table = reportsTable(service);

  const { data: existing } = await table
    .select("id, status, audio_path")
    .eq("program_id", input.programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (existing && (existing as DailyReportRow).status === "published") {
    return { ok: false, error: "Today's report is already published" };
  }

  let reportId = (existing as DailyReportRow | null)?.id;
  const previousPath = (existing as DailyReportRow | null)?.audio_path;

  if (!reportId) {
    const { data: inserted, error: insertError } = await table
      .insert({
        program_id: input.programId,
        org_id: access.orgId,
        recorded_by: input.userId,
        report_date: reportDate,
        scope: input.scope,
        status: "draft",
        upload_status: "uploading",
        updated_at: new Date().toISOString(),
      } as never)
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { ok: false, error: "Could not create report draft" };
    }
    reportId = (inserted as { id: string }).id;
  } else {
    await table
      .update({
        scope: input.scope,
        recorded_by: input.userId,
        upload_status: "uploading",
        upload_error: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", reportId);
  }

  const ext = audioExtension(input.file.type);
  const storagePath = `${access.orgId}/${input.programId}/${reportId}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from(AUDIO_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: input.file.type,
      upsert: true,
    });

  if (uploadError) {
    await table
      .update({
        upload_status: "failed",
        upload_error: uploadError.message,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", reportId);

    return { ok: false, error: "Upload failed" };
  }

  if (previousPath && previousPath !== storagePath) {
    await service.storage.from(AUDIO_STORAGE_BUCKET).remove([previousPath]);
  }

  const { data: updated, error: updateError } = await table
    .update({
      audio_path: storagePath,
      audio_duration_ms: input.durationMs,
      audio_mime_type: input.file.type,
      upload_status: "uploaded",
      upload_error: null,
      status: "draft",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", reportId)
    .select(
      "id, program_id, org_id, recorded_by, report_date, status, scope, audio_duration_ms, upload_status, upload_error, created_at, updated_at",
    )
    .single();

  if (updateError || !updated) {
    return { ok: false, error: "Could not save report metadata" };
  }

  await enqueueJob({
    type: "voice_transcribe",
    payload: { reportId },
    idempotencyKey: `voice-transcribe-${reportId}`,
  });

  return { ok: true, draft: mapDraft(updated as DailyReportRow) };
}
