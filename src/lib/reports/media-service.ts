import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  PHOTOS_STORAGE_BUCKET,
} from "@/lib/reports/media-constants";
import type {
  MediaAssetItem,
  MediaRosterChild,
  MediaWorkspace,
} from "@/lib/reports/media-types";
import {
  mediaAssetsTable,
  mediaChildTagsTable,
  reportChildrenTable,
  reportsTable,
  serviceClient,
  timelineEventsTable,
  todayDateString,
} from "@/lib/reports/table-utils";
import { assertCoachCanPublish } from "@/lib/reports/coach-publish-gate";
import { assertCoachProgramAccess } from "@/lib/reports/voice-report-service";
import { enqueueJob } from "@/lib/jobs/queue";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 3600;

type DailyReportRow = {
  id: string;
  program_id: string;
  org_id: string;
  report_date: string;
  status: string;
};

type MediaRow = {
  id: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
};

type TagRow = {
  media_asset_id: string;
  child_id: string;
};

type EnrolledRow = {
  registration_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  parent_id: string;
};

/** Optional virus scan hook — returns clean in MVP. */
export async function runVirusScanHook(_buffer: Buffer): Promise<boolean> {
  return true;
}

async function signedPhotoUrl(path: string): Promise<string | null> {
  const service = serviceClient();
  const { data, error } = await service.storage
    .from(PHOTOS_STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function loadEnrolledChildren(programId: string): Promise<EnrolledRow[]> {
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

async function signedChildAvatar(
  parentId: string,
  photoPath: string | null,
): Promise<string | null> {
  if (!photoPath) return null;
  const service = serviceClient();
  const { data } = await service.storage
    .from("child-photos")
    .createSignedUrl(photoPath, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

async function getOrCreateTodayReport(
  userId: string,
  programId: string,
  orgId: string,
): Promise<DailyReportRow> {
  const reportDate = todayDateString();
  const supabase = await createClient();

  const { data: existing } = await reportsTable(supabase)
    .select("id, program_id, org_id, report_date, status")
    .eq("program_id", programId)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (existing) return existing as DailyReportRow;

  const service = serviceClient();
  const { data: created, error } = await reportsTable(service)
    .insert({
      program_id: programId,
      org_id: orgId,
      recorded_by: userId,
      report_date: reportDate,
      status: "draft",
      scope: "group",
      upload_status: "pending",
    })
    .select("id, program_id, org_id, report_date, status")
    .single();

  if (error || !created) {
    throw new Error("Could not create daily report");
  }

  return created as DailyReportRow;
}

async function loadTagsForAssets(
  assetIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (assetIds.length === 0) return map;

  const service = serviceClient();
  const { data } = await mediaChildTagsTable(service)
    .select("media_asset_id, child_id")
    .in("media_asset_id", assetIds);

  for (const row of (data ?? []) as TagRow[]) {
    const list = map.get(row.media_asset_id) ?? [];
    list.push(row.child_id);
    map.set(row.media_asset_id, list);
  }
  return map;
}

export async function countUntaggedMedia(reportId: string): Promise<number> {
  const service = serviceClient();
  const { data: assets } = await mediaAssetsTable(service)
    .select("id")
    .eq("daily_report_id", reportId)
    .in("status", ["ready", "uploading"]);

  const ids = ((assets ?? []) as { id: string }[]).map((a) => a.id);
  if (ids.length === 0) return 0;

  const tags = await loadTagsForAssets(ids);
  return ids.filter((id) => (tags.get(id)?.length ?? 0) === 0).length;
}

export async function getMediaWorkspace(
  userId: string,
  programId: string,
): Promise<{ ok: true; workspace: MediaWorkspace } | { ok: false; error: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const report = await getOrCreateTodayReport(
    userId,
    programId,
    access.orgId,
  );

  const enrolled = await loadEnrolledChildren(programId);
  const supabase = await createClient();

  const { data: reportChildren } = await reportChildrenTable(supabase)
    .select("id, child_id")
    .eq("daily_report_id", report.id);

  const reportChildByChildId = new Map(
    ((reportChildren ?? []) as { id: string; child_id: string }[]).map((r) => [
      r.child_id,
      r.id,
    ]),
  );

  const children: MediaRosterChild[] = await Promise.all(
    enrolled.map(async (row) => ({
      childId: row.child_id,
      registrationId: row.registration_id,
      firstName: row.first_name,
      lastName: row.last_name,
      photoSignedUrl: await signedChildAvatar(row.parent_id, row.photo_url),
      reportChildId: reportChildByChildId.get(row.child_id) ?? null,
    })),
  );

  const service = serviceClient();
  const { data: assetRows } = await mediaAssetsTable(service)
    .select(
      "id, storage_path, mime_type, file_size, caption, status, published_at, created_at",
    )
    .eq("daily_report_id", report.id)
    .order("created_at", { ascending: false });

  const rows = (assetRows ?? []) as MediaRow[];
  const tagMap = await loadTagsForAssets(rows.map((r) => r.id));

  const assets: MediaAssetItem[] = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      storagePath: row.storage_path,
      signedUrl: await signedPhotoUrl(row.storage_path),
      mimeType: row.mime_type,
      fileSize: row.file_size,
      caption: row.caption,
      status: row.status as MediaAssetItem["status"],
      taggedChildIds: tagMap.get(row.id) ?? [],
      publishedAt: row.published_at,
      createdAt: row.created_at,
    })),
  );

  const draftAssets = assets.filter((a) => a.status === "ready");
  const untaggedCount = draftAssets.filter(
    (a) => a.taggedChildIds.length === 0,
  ).length;
  const readyToPublishCount = draftAssets.filter(
    (a) => a.taggedChildIds.length > 0,
  ).length;

  return {
    ok: true,
    workspace: {
      reportId: report.id,
      programId,
      programName: access.programName,
      reportDate: report.report_date,
      reportStatus: report.status,
      children,
      assets,
      untaggedCount,
      readyToPublishCount,
    },
  };
}

export async function uploadMediaAsset(
  userId: string,
  programId: string,
  file: File,
  exifStripped: boolean,
): Promise<
  | { ok: true; asset: MediaAssetItem }
  | { ok: false; error: string; code?: string }
> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  if (!ALLOWED_PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "Invalid file", code: "file_invalid" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const clean = await runVirusScanHook(buffer);
  if (!clean) {
    return { ok: false, error: "File rejected", code: "scan_failed" };
  }

  const report = await getOrCreateTodayReport(
    userId,
    programId,
    access.orgId,
  );

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const mediaId = crypto.randomUUID();
  const storagePath = `${access.orgId}/${programId}/${report.report_date}/${mediaId}.${ext}`;

  const service = serviceClient();
  const { error: uploadError } = await service.storage
    .from(PHOTOS_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: "Upload failed", code: "upload_failed" };
  }

  const { data: row, error } = await mediaAssetsTable(service)
    .insert({
      id: mediaId,
      daily_report_id: report.id,
      program_id: programId,
      org_id: access.orgId,
      uploaded_by: userId,
      storage_path: storagePath,
      mime_type: file.type,
      file_size: file.size,
      status: "ready",
      exif_stripped: exifStripped,
    })
    .select(
      "id, storage_path, mime_type, file_size, caption, status, published_at, created_at",
    )
    .single();

  if (error || !row) {
    return { ok: false, error: "Could not save media record" };
  }

  const mediaRow = row as MediaRow;
  return {
    ok: true,
    asset: {
      id: mediaRow.id,
      storagePath: mediaRow.storage_path,
      signedUrl: await signedPhotoUrl(mediaRow.storage_path),
      mimeType: mediaRow.mime_type,
      fileSize: mediaRow.file_size,
      caption: mediaRow.caption,
      status: mediaRow.status as MediaAssetItem["status"],
      taggedChildIds: [],
      publishedAt: mediaRow.published_at,
      createdAt: mediaRow.created_at,
    },
  };
}

export async function updateMediaTags(
  userId: string,
  programId: string,
  mediaId: string,
  childIds: string[],
): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const service = serviceClient();
  const { data: asset } = await mediaAssetsTable(service)
    .select("id, program_id, status, daily_report_id")
    .eq("id", mediaId)
    .eq("program_id", programId)
    .maybeSingle();

  if (!asset) return { ok: false, error: "Not found" };
  if ((asset as { status: string }).status === "published") {
    return { ok: false, error: "Already published", code: "already_published" };
  }

  const enrolled = await loadEnrolledChildren(programId);
  const allowed = new Set(enrolled.map((e) => e.child_id));
  const validIds = childIds.filter((id) => allowed.has(id));

  const { data: reportChildren } = await reportChildrenTable(service)
    .select("id, child_id")
    .eq("daily_report_id", (asset as { daily_report_id: string }).daily_report_id);

  const reportChildMap = new Map(
    ((reportChildren ?? []) as { id: string; child_id: string }[]).map((r) => [
      r.child_id,
      r.id,
    ]),
  );

  await mediaChildTagsTable(service)
    .delete()
    .eq("media_asset_id", mediaId);

  if (validIds.length > 0) {
    await mediaChildTagsTable(service).insert(
      validIds.map((childId) => ({
        media_asset_id: mediaId,
        child_id: childId,
        report_child_id: reportChildMap.get(childId) ?? null,
      })),
    );
  }

  return { ok: true };
}

export async function updateMediaCaption(
  userId: string,
  programId: string,
  mediaId: string,
  caption: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const service = serviceClient();
  const { error } = await mediaAssetsTable(service)
    .update({
      caption: caption?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .eq("program_id", programId)
    .neq("status", "published");

  if (error) return { ok: false, error: "Update failed" };
  return { ok: true };
}

export async function deleteMediaAsset(
  userId: string,
  programId: string,
  mediaId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) return { ok: false, error: access.error };

  const service = serviceClient();
  const { data: asset } = await mediaAssetsTable(service)
    .select("id, storage_path, status")
    .eq("id", mediaId)
    .eq("program_id", programId)
    .maybeSingle();

  if (!asset) return { ok: false, error: "Not found" };
  if ((asset as { status: string }).status === "published") {
    return { ok: false, error: "Cannot delete published media" };
  }

  await service.storage
    .from(PHOTOS_STORAGE_BUCKET)
    .remove([(asset as { storage_path: string }).storage_path]);

  await mediaAssetsTable(service).delete().eq("id", mediaId);
  return { ok: true };
}

async function syncReportChildPhotoCounts(reportId: string): Promise<void> {
  const service = serviceClient();

  const { data: publishedAssets } = await mediaAssetsTable(service)
    .select("id")
    .eq("daily_report_id", reportId)
    .eq("status", "published");

  const publishedIds = ((publishedAssets ?? []) as { id: string }[]).map(
    (a) => a.id,
  );

  const { data: children } = await reportChildrenTable(service)
    .select("id, child_id")
    .eq("daily_report_id", reportId);

  for (const child of (children ?? []) as { id: string; child_id: string }[]) {
    let count = 0;
    if (publishedIds.length > 0) {
      const { count: tagCount } = await mediaChildTagsTable(service)
        .select("id", { count: "exact", head: true })
        .eq("child_id", child.child_id)
        .in("media_asset_id", publishedIds);
      count = tagCount ?? 0;
    }

    await reportChildrenTable(service)
      .update({ photo_count: count, updated_at: new Date().toISOString() })
      .eq("id", child.id);
  }
}

export async function publishTaggedMedia(
  userId: string,
  programId: string,
): Promise<
  | { ok: true; publishedCount: number; familiesNotified: number }
  | { ok: false; error: string; code?: string }
> {
  const access = await assertCoachCanPublish(userId, programId);
  if (!access.ok) return { ok: false, error: access.error, code: access.code };

  const workspace = await getMediaWorkspace(userId, programId);
  if (!workspace.ok) return { ok: false, error: workspace.error };

  const { reportId, reportDate } = workspace.workspace;

  if (workspace.workspace.untaggedCount > 0) {
    return {
      ok: false,
      error: "Tag every photo before publishing",
      code: "untagged_media",
    };
  }

  const readyAssets = workspace.workspace.assets.filter(
    (a) => a.status === "ready" && a.taggedChildIds.length > 0,
  );

  if (readyAssets.length === 0) {
    return { ok: false, error: "No photos ready to publish", code: "empty" };
  }

  const service = serviceClient();
  const now = new Date().toISOString();
  const notifiedFamilies = new Set<string>();

  for (const asset of readyAssets) {
    const signedUrl = await signedPhotoUrl(asset.storagePath);

    await mediaAssetsTable(service)
      .update({
        status: "published",
        published_at: now,
        updated_at: now,
      })
      .eq("id", asset.id);

    for (const childId of asset.taggedChildIds) {
      const enrolled = workspace.workspace.children.find(
        (c) => c.childId === childId,
      );

      await timelineEventsTable(service).insert({
        child_id: childId,
        org_id: access.orgId,
        program_id: programId,
        daily_report_id: reportId,
        report_child_id: enrolled?.reportChildId ?? null,
        event_type: "photo",
        title: asset.caption?.trim() || "New photo",
        summary: asset.caption?.trim() || null,
        metadata: {
          reportDate,
          mediaAssetId: asset.id,
          photos: signedUrl ? [{ id: asset.id, url: signedUrl }] : [],
        },
        occurred_at: now,
        created_by: userId,
      });

      notifiedFamilies.add(childId);
    }
  }

  await syncReportChildPhotoCounts(reportId);

  await enqueueJob({
    type: "notify_parents",
    payload: { reportId, programId, mediaPublish: true },
    idempotencyKey: `notify-media-${reportId}-${now.slice(0, 16)}`,
  });

  return {
    ok: true,
    publishedCount: readyAssets.length,
    familiesNotified: notifiedFamilies.size,
  };
}
