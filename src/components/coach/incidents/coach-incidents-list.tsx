"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { PremiumCta } from "@/components/marketing/premium-cta";
import type { IncidentListItem } from "@/lib/incidents/incident-types";
import { cn } from "@/lib/utils";

type CoachIncidentsListProps = {
  initialItems: IncidentListItem[];
  initialHasMore: boolean;
};

function severityBadge(severity: string, isRed: boolean) {
  if (isRed || severity === "red") {
    return "bg-destructive/10 text-destructive";
  }
  if (severity === "yellow") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
  return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
}

export function CoachIncidentsList({
  initialItems,
  initialHasMore,
}: CoachIncidentsListProps) {
  const t = useTranslations("coach.incidents.list");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/incidents?page=${pageNum}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        items?: IncidentListItem[];
        hasMore?: boolean;
      };
      if (data.ok && data.items) {
        setItems((prev) => (append ? [...prev, ...data.items!] : data.items!));
        setHasMore(data.hasMore ?? false);
        setPage(pageNum);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialItems.length === 0) {
      void load(1, false);
    }
  }, [initialItems.length, load]);

  if (items.length === 0 && !loading) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 ring-1 ring-border/50 md:p-10">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-foreground">{t("emptyTitle")}</h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
        <PremiumCta href="/coach/incidents/new" className="mt-6" showArrow={false}>
          {t("emptyCta")}
        </PremiumCta>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/coach/incidents/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-[220ms] ease-out hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          {t("reportCta")}
        </Link>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/coach/incidents/${item.id}`}
              className={cn(
                "block rounded-[1rem] bg-card px-4 py-4 ring-1 ring-border/50 transition-[box-shadow,transform] duration-[220ms] ease-out hover:-translate-y-0.5",
                item.isRedFlag && "ring-destructive/20",
              )}
            >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      severityBadge(item.severity, item.isRedFlag),
                    )}
                  >
                    {item.isRedFlag && (
                      <AlertTriangle className="mr-1 inline size-3" aria-hidden />
                    )}
                    {t(`severity.${item.severity}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.programName}</span>
                </div>
                <p className="font-medium text-foreground">
                  {item.childFirstName} {item.childLastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.occurredAt).toLocaleString()}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {item.parentNotifiedAt ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t("parentNotified")}
                  </span>
                ) : item.notificationStagedAt ? (
                  <span>{t("notifyPending")}</span>
                ) : null}
              </div>
            </div>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(page + 1, true)}
          className="w-full rounded-lg py-2.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
        >
          {loading ? t("loading") : t("loadMore")}
        </button>
      )}
    </div>
  );
}
