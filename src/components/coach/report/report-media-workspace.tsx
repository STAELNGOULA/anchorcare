"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ImagePlus, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CoachReportNavStrip } from "@/components/coach/report/coach-report-nav-strip";
import { MediaUploadItem } from "@/components/coach/report/media-upload-item";
import type { ProgramListItem } from "@/lib/business/program-types";
import type { MediaWorkspace } from "@/lib/reports/media-types";
import { stripExifFromImageFile } from "@/lib/reports/strip-exif-client";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/reports/media-constants";

type ReportMediaWorkspaceProps = {
  program: ProgramListItem;
  programs: ProgramListItem[];
  initialWorkspace: MediaWorkspace;
};

type PendingUpload = {
  localId: string;
  file: File;
  previewUrl: string;
  progress: number;
};

async function refreshWorkspace(programId: string): Promise<MediaWorkspace> {
  const res = await fetch(`/api/coach/report/${programId}/media`);
  if (!res.ok) throw new Error("refresh_failed");
  const body = (await res.json()) as { workspace: MediaWorkspace };
  return body.workspace;
}

export function ReportMediaWorkspace({
  program,
  programs,
  initialWorkspace,
}: ReportMediaWorkspaceProps) {
  const t = useTranslations("coach.report.media");
  const inputRef = useRef<HTMLInputElement>(null);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftAssets = workspace.assets.filter((a) => a.status === "ready");

  const uploadFile = useCallback(
    async (file: File, localId: string) => {
      try {
        const stripped = await stripExifFromImageFile(file);
        const uploadBlob =
          stripped instanceof File ? stripped : new File([stripped], file.name, { type: file.type });

        setPending((prev) =>
          prev.map((p) =>
            p.localId === localId ? { ...p, progress: 30 } : p,
          ),
        );

        const form = new FormData();
        form.append("file", uploadBlob);
        form.append("exifStripped", "true");

        setPending((prev) =>
          prev.map((p) =>
            p.localId === localId ? { ...p, progress: 70 } : p,
          ),
        );

        const res = await fetch(
          `/api/coach/report/${program.id}/media/upload`,
          { method: "POST", body: form },
        );

        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "upload_failed");
        }

        setPending((prev) =>
          prev.map((p) =>
            p.localId === localId ? { ...p, progress: 100 } : p,
          ),
        );

        const next = await refreshWorkspace(program.id);
        setWorkspace(next);
      } catch {
        setError(t("errors.uploadFailed"));
        toast.error(t("errors.uploadFailed"));
      } finally {
        setPending((prev) => {
          const item = prev.find((p) => p.localId === localId);
          if (item) URL.revokeObjectURL(item.previewUrl);
          return prev.filter((p) => p.localId !== localId);
        });
      }
    },
    [program.id, t],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);

      for (const file of Array.from(files)) {
        if (!ALLOWED_PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
          toast.error(t("errors.fileInvalid"));
          continue;
        }
        const localId = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        setPending((prev) => [
          ...prev,
          { localId, file, previewUrl, progress: 5 },
        ]);
        void uploadFile(file, localId);
      }
    },
    [t, uploadFile],
  );

  const saveTags = useCallback(
    async (mediaId: string, childIds: string[]) => {
      await fetch(`/api/coach/report/${program.id}/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childIds }),
      });
      setWorkspace((prev) => ({
        ...prev,
        assets: prev.assets.map((a) =>
          a.id === mediaId ? { ...a, taggedChildIds: childIds } : a,
        ),
        untaggedCount: prev.assets
          .map((a) =>
            a.id === mediaId ? { ...a, taggedChildIds: childIds } : a,
          )
          .filter((a) => a.status === "ready" && a.taggedChildIds.length === 0)
          .length,
        readyToPublishCount: prev.assets
          .map((a) =>
            a.id === mediaId ? { ...a, taggedChildIds: childIds } : a,
          )
          .filter((a) => a.status === "ready" && a.taggedChildIds.length > 0)
          .length,
      }));
    },
    [program.id],
  );

  const saveCaption = useCallback(
    async (mediaId: string, caption: string) => {
      setWorkspace((prev) => ({
        ...prev,
        assets: prev.assets.map((a) =>
          a.id === mediaId ? { ...a, caption } : a,
        ),
      }));
      await fetch(`/api/coach/report/${program.id}/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
    },
    [program.id],
  );

  const removeAsset = useCallback(
    async (mediaId: string) => {
      await fetch(`/api/coach/report/${program.id}/media/${mediaId}`, {
        method: "DELETE",
      });
      const next = await refreshWorkspace(program.id);
      setWorkspace(next);
    },
    [program.id],
  );

  const publish = useCallback(async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/coach/report/${program.id}/media/publish`,
        { method: "POST" },
      );
      const body = (await res.json()) as {
        error?: string;
        code?: string;
        publishedCount?: number;
      };
      if (!res.ok) {
        if (body.code === "untagged_media") {
          setError(t("errors.untaggedBlocked"));
        } else {
          setError(body.error ?? t("errors.publishFailed"));
        }
        return;
      }
      toast.success(
        t("publishSuccess", { count: body.publishedCount ?? 0 }),
      );
      const next = await refreshWorkspace(program.id);
      setWorkspace(next);
    } catch {
      setError(t("errors.publishFailed"));
    } finally {
      setPublishing(false);
    }
  }, [program.id, t]);

  const canPublish =
    workspace.readyToPublishCount > 0 && workspace.untaggedCount === 0;

  return (
    <div className="space-y-8">
      <CoachReportNavStrip
        programs={programs}
        programId={program.id}
        active="media"
      />

      <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl text-foreground">{t("pickerTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("pickerBody")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("manualTagOnly")}</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <Camera className="size-4" aria-hidden />
            {t("addPhotos")}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {workspace.children.length === 0 ? (
        <div className="rounded-[1.25rem] bg-muted/30 p-6 text-sm text-muted-foreground ring-1 ring-border/40">
          {t("noRoster")}
        </div>
      ) : null}

      {pending.length === 0 && draftAssets.length === 0 && workspace.assets.every(a => a.status === 'published') ? (
        <div className="flex flex-col items-center gap-3 rounded-[1.25rem] border border-dashed border-border/60 py-16 text-center">
          <ImagePlus className="size-10 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("emptyQueue")}</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {pending.map((item) => (
          <MediaUploadItem
            key={item.localId}
            asset={{
              id: item.localId,
              storagePath: "",
              signedUrl: null,
              mimeType: item.file.type,
              fileSize: item.file.size,
              caption: null,
              status: "uploading",
              taggedChildIds: [],
              publishedAt: null,
              createdAt: new Date().toISOString(),
            }}
            rosterChildren={workspace.children}
            previewUrl={item.previewUrl}
            uploadProgress={item.progress}
            isUploading
            onTagsChange={() => undefined}
            onCaptionChange={() => undefined}
            onRemove={() => undefined}
          />
        ))}

        {workspace.assets.map((asset) => (
          <MediaUploadItem
            key={asset.id}
            asset={asset}
            rosterChildren={workspace.children}
            onTagsChange={(ids) => void saveTags(asset.id, ids)}
            onCaptionChange={(caption) => void saveCaption(asset.id, caption)}
            onRemove={() => void removeAsset(asset.id)}
          />
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {workspace.untaggedCount > 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {t("untaggedWarning", { count: workspace.untaggedCount })}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("footerSummary", { count: workspace.readyToPublishCount })}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/coach/report/${program.id}/review`}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm ring-1 ring-border/60"
          >
            {t("reviewCta")}
          </Link>
          <button
            type="button"
            disabled={!canPublish || publishing}
            onClick={() => void publish()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="size-4" aria-hidden />
            {publishing ? t("publishing") : t("publishCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
