"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { AdminBusinessListItem } from "@/lib/admin/platform-types";
import { cn } from "@/lib/utils";

export function AdminBusinessesWorkspace() {
  const t = useTranslations("admin.businesses");
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setBusinesses([]);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/admin/businesses?q=${encodeURIComponent(q.trim())}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(search), 280);
    return () => clearTimeout(timer);
  }, [search, load]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-full border border-input bg-background py-2 pl-11 pr-4 text-sm"
        />
      </div>

      {error ? (
        <ErrorState title={t("errorTitle")} onRetry={() => void load(search)} />
      ) : null}
      {loading ? <SkeletonList count={4} /> : null}

      {!loading && search.trim().length >= 2 && businesses.length === 0 && !error ? (
        <EmptyState title={t("noResults")} description={t("noResultsBody")} />
      ) : null}

      <div className="space-y-3">
        {businesses.map((biz) => (
          <div
            key={biz.id}
            className={cn(
              "rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
              "transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-foreground">{biz.name}</p>
                <p className="text-sm text-muted-foreground">
                  /p/{biz.publicSlug}
                  {biz.directorEmail ? ` · ${biz.directorEmail}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {biz.verifiedBadge ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t("verified")}
                  </span>
                ) : null}
                {biz.subscriptionStatus ? (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                    {biz.subscriptionStatus}
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    {t("trial")}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("meta", {
                programs: biz.programCount,
                type: biz.orgType,
              })}
            </p>
            <Link
              href={`/p/${biz.publicSlug}`}
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden />
              {t("viewPublic")}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
