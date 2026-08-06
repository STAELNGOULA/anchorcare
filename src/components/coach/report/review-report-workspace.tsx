"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AudioPlayerPanel } from "@/components/coach/report/audio-player-panel";
import { ChildDraftCard } from "@/components/coach/report/child-draft-card";
import { ProgramPickerStrip } from "@/components/coach/report/program-picker-strip";
import { ConfettiBurst } from "@/components/business/onboarding/confetti-burst";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ProgramListItem } from "@/lib/business/program-types";
import type {
  ReportChildDraft,
  ReviewWorkspace,
} from "@/lib/reports/review-report-service";

type ReviewReportWorkspaceProps = {
  program: ProgramListItem;
  programs: ProgramListItem[];
  initialWorkspace: ReviewWorkspace;
};

type LocalDraft = ReportChildDraft & { dirty?: boolean };

export function ReviewReportWorkspace({
  program,
  programs,
  initialWorkspace,
}: ReviewReportWorkspaceProps) {
  const t = useTranslations("coach.report.review");
  const router = useRouter();

  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [drafts, setDrafts] = useState<LocalDraft[]>(initialWorkspace.children);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [publishToken] = useState(() => crypto.randomUUID());

  const isPublished = workspace.status === "published";

  const misassignedCount = useMemo(
    () =>
      drafts.filter(
        (d) =>
          (d.misassignedFlag || d.status === "flagged") &&
          d.status !== "skipped",
      ).length,
    [drafts],
  );

  const publishableCount = useMemo(
    () =>
      drafts.filter(
        (d) =>
          d.status !== "skipped" &&
          d.status !== "published" &&
          !d.misassignedFlag &&
          (d.draftText?.trim().length ?? 0) > 0,
      ).length,
    [drafts],
  );

  const updateDraft = useCallback((id: string, patch: Partial<LocalDraft>) => {
    setDrafts((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, ...patch, dirty: true } : row,
      ),
    );
  }, []);

  const saveDrafts = useCallback(async () => {
    setSaving(true);
    setError(null);
    const updates = drafts
      .filter((d) => d.dirty)
      .map((d) => ({
        id: d.id,
        draftText: d.draftText ?? undefined,
        status: d.status,
        skippedReason: d.skippedReason,
        misassignedFlag: d.misassignedFlag,
      }));

    if (updates.length === 0) {
      setSaving(false);
      return true;
    }

    const res = await fetch(`/api/coach/report/${program.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? t("errors.saveFailed"));
      return false;
    }

    setDrafts((prev) => prev.map((d) => ({ ...d, dirty: false })));
    return true;
  }, [drafts, program.id, t]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setError(null);

    const saved = await saveDrafts();
    if (!saved) {
      setPublishing(false);
      return;
    }

    const res = await fetch(`/api/coach/report/${program.id}/review/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": publishToken,
      },
      body: JSON.stringify({ publishToken }),
    });

    setPublishing(false);
    setPublishOpen(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string; code?: string };
      setError(
        body.code === "untagged_media"
          ? t("errors.untaggedMedia")
          : body.error ?? t("errors.publishFailed"),
      );
      return;
    }

    const body = (await res.json()) as {
      result: { publishedCount: number; alreadyPublished: boolean };
    };

    setWorkspace((prev) => ({
      ...prev,
      status: "published",
      publishedAt: new Date().toISOString(),
    }));
    setDrafts((prev) =>
      prev.map((d) =>
        d.status !== "skipped" && !d.misassignedFlag
          ? { ...d, status: "published" as const }
          : d,
      ),
    );

    if (!body.result.alreadyPublished) {
      setConfetti(true);
    }
  }, [program.id, publishToken, saveDrafts, t]);

  const handleDiscard = useCallback(async () => {
    setDiscarding(true);
    setError(null);

    const res = await fetch(`/api/coach/report/${program.id}/review`, {
      method: "DELETE",
    });

    setDiscarding(false);
    setDiscardOpen(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? t("errors.discardFailed"));
      return;
    }

    router.push(`/coach/report/${program.id}/voice`);
  }, [program.id, router, t]);

  return (
    <div className="space-y-8 pb-28">
      <ConfettiBurst active={confetti} />
      <ProgramPickerStrip programs={programs} activeProgramId={program.id} />

      {misassignedCount > 0 ? (
        <div className="rounded-[1rem] border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-foreground">
          {t("misassignedBanner", { count: misassignedCount })}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1rem] border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10">
        <AudioPlayerPanel
          audioUrl={workspace.audioSignedUrl}
          durationMs={workspace.audioDurationMs}
          transcript={workspace.groupTranscript}
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript((v) => !v)}
        />

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {t("draftsLabel")}
              </p>
              <h2 className="font-display text-2xl text-foreground">
                {t("draftsTitle", { count: drafts.length })}
              </h2>
            </div>
            {isPublished ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {t("publishedBadge")}
              </span>
            ) : null}
          </div>

          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <ChildDraftCard
                key={draft.id}
                draft={draft}
                index={index}
                published={isPublished}
                onChange={(patch) => updateDraft(draft.id, patch)}
              />
            ))}
          </div>
        </div>
      </div>

      {!isPublished ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("footerSummary", { count: publishableCount })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveDrafts()}
                className="inline-flex min-h-11 items-center rounded-full px-5 text-sm ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? t("saving") : t("saveDrafts")}
              </button>
              <button
                type="button"
                onClick={() => setDiscardOpen(true)}
                className="inline-flex min-h-11 items-center rounded-full px-5 text-sm text-muted-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                {t("discard")}
              </button>
              <button
                type="button"
                disabled={publishableCount === 0 || misassignedCount > 0}
                onClick={() => setPublishOpen(true)}
                className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm text-background transition-transform duration-200 ease-out active:scale-[0.98] disabled:opacity-50"
              >
                {t("publishAll", { count: publishableCount })}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.25rem] bg-primary/8 px-5 py-4 ring-1 ring-primary/20">
          <p className="text-sm font-medium text-foreground">{t("successTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("successBody")}</p>
          <Link
            href="/coach/programs"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm text-background"
          >
            {t("doneCta")}
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={t("publishConfirmTitle")}
        description={t("publishConfirmBody", {
          count: publishableCount,
          skipped: drafts.filter((d) => d.status === "skipped").length,
        })}
        confirmLabel={t("publishConfirmCta")}
        loading={publishing}
        onConfirm={handlePublish}
      />

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t("discardConfirmTitle")}
        description={t("discardConfirmBody")}
        confirmLabel={t("discardConfirmCta")}
        cancelLabel={t("cancel")}
        variant="destructive"
        loading={discarding}
        onConfirm={handleDiscard}
      />
    </div>
  );
}
