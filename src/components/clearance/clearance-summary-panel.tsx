"use client";

import { useTranslations } from "next-intl";
import { ClearancePreviewCard } from "@/components/clearance/clearance-preview-card";
import type { StaffClearanceSummary } from "@/lib/clearance/clearance-types";

type ClearanceSummaryPanelProps = {
  summary: StaffClearanceSummary | null;
};

export function ClearanceSummaryPanel({ summary }: ClearanceSummaryPanelProps) {
  const t = useTranslations("roster.clearanceSummary");

  if (!summary) {
    return (
      <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("title")}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("title")}
      </h2>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      <ClearancePreviewCard
        shareStatus={summary.shareStatus}
        summary={summary.summary}
        conditions={summary.conditions}
        expiresAt={summary.expiresAt}
      />
      <p className="text-xs text-muted-foreground">
        {t("sharedAt", {
          date: new Date(summary.sharedAt).toLocaleString(),
        })}
      </p>
    </div>
  );
}
