"use client";

import { useTranslations } from "next-intl";
import type { StaffClearanceSummary } from "@/lib/clearance/clearance-types";
import { cn } from "@/lib/utils";

const STATUS_CLASS = {
  cleared: "text-emerald-700 dark:text-emerald-300",
  cleared_with_conditions: "text-emerald-700 dark:text-emerald-300",
  restricted: "text-red-700 dark:text-red-300",
} as const;

type ClearancePreviewCardProps = {
  shareStatus: StaffClearanceSummary["shareStatus"];
  summary: string;
  conditions: string | null;
  expiresAt: string | null;
  programName?: string;
  orgName?: string;
  className?: string;
};

export function ClearancePreviewCard({
  shareStatus,
  summary,
  conditions,
  expiresAt,
  programName,
  orgName,
  className,
}: ClearancePreviewCardProps) {
  const t = useTranslations("parent.care.clearance");

  return (
    <div
      className={cn(
        "rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {t("preview.label")}
      </p>
      {orgName ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {programName ? `${programName} · ${orgName}` : orgName}
        </p>
      ) : null}
      <p
        className={cn(
          "mt-3 font-display text-xl",
          STATUS_CLASS[shareStatus],
        )}
      >
        {t(`status.${shareStatus}`)}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{summary}</p>
      {conditions ? (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t("preview.conditions")}: </span>
          {conditions}
        </p>
      ) : null}
      {expiresAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("preview.expires", {
            date: new Date(expiresAt).toLocaleDateString(),
          })}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">{t("preview.disclaimer")}</p>
    </div>
  );
}
