"use client";

import { useTranslations } from "next-intl";
import type { IncidentAuditEntry } from "@/lib/incidents/incident-types";
import { cn } from "@/lib/utils";

type IncidentAuditTimelineProps = {
  entries: IncidentAuditEntry[];
  showDiff?: boolean;
};

function actionLabel(
  t: ReturnType<typeof useTranslations>,
  action: string,
): string {
  const key = `actions.${action}` as const;
  try {
    return t(key);
  } catch {
    return action.replace(/_/g, " ");
  }
}

export function IncidentAuditTimeline({
  entries,
  showDiff = true,
}: IncidentAuditTimelineProps) {
  const t = useTranslations("incidents.detail.audit");

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("empty")}</p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border/60 pl-6">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative pb-8 last:pb-0">
          <span
            className={cn(
              "absolute -left-[1.65rem] top-1 flex size-3 rounded-full ring-4 ring-background",
              entry.action === "amended"
                ? "bg-amber-500"
                : entry.action.includes("notified")
                  ? "bg-emerald-500"
                  : "bg-primary",
            )}
            aria-hidden
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="text-sm font-medium text-foreground">
                {actionLabel(t, entry.action)}
              </p>
              <time
                className="text-xs text-muted-foreground"
                dateTime={entry.createdAt}
              >
                {new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(entry.createdAt))}
              </time>
            </div>
            {entry.actorLabel ? (
              <p className="text-xs text-muted-foreground">
                {t("by", { name: entry.actorLabel })}
              </p>
            ) : null}
            {typeof entry.metadata.reason === "string" && entry.metadata.reason ? (
              <p className="text-sm text-foreground/90">{entry.metadata.reason}</p>
            ) : null}
            {showDiff && entry.diff.length > 0 ? (
              <div className="mt-3 space-y-2 rounded-xl bg-secondary/40 p-3 ring-1 ring-border/40">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("changes")}
                </p>
                {entry.diff.map((d) => (
                  <div key={`${entry.id}-${d.field}`} className="text-sm">
                    <p className="font-medium text-foreground">
                      {t(`fields.${d.labelKey}` as "fields.location")}
                    </p>
                    <p className="mt-1 text-muted-foreground line-through">
                      {d.before}
                    </p>
                    <p className="mt-0.5 text-foreground">{d.after}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {index < entries.length - 1 ? null : null}
        </li>
      ))}
    </ol>
  );
}
