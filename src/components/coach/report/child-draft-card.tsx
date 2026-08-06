"use client";

import Image from "next/image";
import { AlertTriangle, Check, SkipForward, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReportChildDraft } from "@/lib/reports/review-report-service";
import { cn } from "@/lib/utils";

type ChildDraftCardProps = {
  draft: ReportChildDraft;
  index: number;
  published?: boolean;
  onChange: (patch: {
    draftText?: string;
    status?: ReportChildDraft["status"];
    skippedReason?: string | null;
    misassignedFlag?: boolean;
  }) => void;
};

export function ChildDraftCard({
  draft,
  index,
  published = false,
  onChange,
}: ChildDraftCardProps) {
  const t = useTranslations("coach.report.review");
  const displayName = draft.mentionedName
    ? draft.mentionedName
    : `${draft.firstName ?? ""} ${draft.lastName ?? ""}`.trim();

  const isSkipped = draft.status === "skipped";
  const isFlagged = draft.misassignedFlag || draft.status === "flagged";
  const isPublished = draft.status === "published" || published;

  const touchStartX = { current: 0 };

  return (
    <article
      className={cn(
        "rounded-[1.25rem] bg-card p-5 ring-1 transition-[transform,opacity,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
        isFlagged ? "ring-destructive/40" : "ring-border/50",
        isSkipped && "opacity-60",
        isPublished && "ring-primary/30",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? 0;
      }}
      onTouchEnd={(event) => {
        const delta =
          (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (delta < -80 && !isPublished && draft.childId) {
          onChange({ status: "skipped", skippedReason: "swipe_skip" });
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
          {draft.photoSignedUrl ? (
            <Image
              src={draft.photoSignedUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-medium text-muted-foreground">
              {displayName.charAt(0)}
            </span>
          )}
          {isPublished ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-3" aria-hidden />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-foreground">{displayName}</h3>
            {isFlagged ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3" />
                {t("misassignedBadge")}
              </span>
            ) : null}
            {isSkipped ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {t("skippedBadge")}
              </span>
            ) : null}
          </div>

          {draft.photoCount > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("photosTagged", { count: draft.photoCount })}
            </p>
          ) : null}

          {isFlagged ? (
            <>
              <p className="mt-3 text-sm text-destructive">{t("misassignedHint")}</p>
              {!isPublished ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({ status: "skipped", skippedReason: "misassigned" })
                  }
                  className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs text-muted-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <SkipForward className="size-3.5" />
                  {t("skip")}
                </button>
              ) : null}
            </>
          ) : (
            <textarea
              value={draft.draftText ?? ""}
              disabled={isPublished || isSkipped}
              onChange={(event) => onChange({ draftText: event.target.value })}
              rows={4}
              className="mt-3 w-full resize-y rounded-[0.875rem] border border-border/60 bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder={t("draftPlaceholder")}
            />
          )}

          {!isPublished && !isFlagged ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange(
                    isSkipped
                      ? { status: "draft", skippedReason: null }
                      : { status: "skipped", skippedReason: "coach_skip" },
                  )
                }
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs text-muted-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <SkipForward className="size-3.5" />
                {isSkipped ? t("unskip") : t("skip")}
              </button>
              {draft.childId ? (
                <button
                  type="button"
                  onClick={() => onChange({ misassignedFlag: true })}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs text-muted-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <UserX className="size-3.5" />
                  {t("flagMisassigned")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
