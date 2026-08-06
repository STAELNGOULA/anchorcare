"use client";

import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaChildTagGrid } from "@/components/coach/report/media-child-tag-grid";
import type { MediaAssetItem, MediaRosterChild } from "@/lib/reports/media-types";
import { cn } from "@/lib/utils";

type MediaUploadItemProps = {
  asset: MediaAssetItem;
  rosterChildren: MediaRosterChild[];
  previewUrl?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  onTagsChange: (childIds: string[]) => void;
  onCaptionChange: (caption: string) => void;
  onRemove: () => void;
};

export function MediaUploadItem({
  asset,
  rosterChildren,
  previewUrl,
  uploadProgress,
  isUploading = false,
  onTagsChange,
  onCaptionChange,
  onRemove,
}: MediaUploadItemProps) {
  const t = useTranslations("coach.report.media");
  const src = previewUrl ?? asset.signedUrl;
  const isPublished = asset.status === "published";
  const untagged = !isUploading && asset.taggedChildIds.length === 0;

  return (
    <article
      className={cn(
        "rounded-[1.25rem] bg-card p-4 ring-1 ring-border/50",
        untagged && !isPublished && "ring-amber-500/40",
      )}
    >
      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/40">
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
          {isUploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="mt-1 text-[10px] font-medium text-foreground">
                {uploadProgress ?? 0}%
              </span>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                {isPublished ? t("publishedBadge") : t("draftBadge")}
              </p>
              {untagged && !isPublished ? (
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {t("tagRequired")}
                </p>
              ) : null}
            </div>
            {!isPublished && !isUploading ? (
              <button
                type="button"
                onClick={onRemove}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                aria-label={t("removePhoto")}
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>

          {!isPublished ? (
            <>
              <MediaChildTagGrid
                children={rosterChildren}
                selectedIds={asset.taggedChildIds}
                onChange={onTagsChange}
                disabled={isUploading}
              />
              <input
                type="text"
                value={asset.caption ?? ""}
                onChange={(e) => onCaptionChange(e.target.value)}
                placeholder={t("captionPlaceholder")}
                disabled={isUploading}
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border/40 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("taggedCount", { count: asset.taggedChildIds.length })}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
