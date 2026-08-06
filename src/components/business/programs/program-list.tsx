"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProgramCard } from "@/components/business/programs/program-card";
import { PremiumCta } from "@/components/marketing/premium-cta";
import type { ProgramListItem, ProgramStatus } from "@/lib/business/program-types";
import { cn } from "@/lib/utils";

type ProgramListProps = {
  initialPrograms: ProgramListItem[];
  initialTotal: number;
};

type FilterStatus = ProgramStatus | "all";

export function ProgramList({ initialPrograms, initialTotal }: ProgramListProps) {
  const t = useTranslations("business.programs");
  const [programs, setPrograms] = useState(initialPrograms);
  const [total, setTotal] = useState(initialTotal);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (status: FilterStatus) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/business/programs?${params.toString()}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        programs?: ProgramListItem[];
        total?: number;
      };
      if (data.ok && data.programs) {
        setPrograms(data.programs);
        setTotal(data.total ?? data.programs.length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const filters: FilterStatus[] = ["all", "active", "draft", "archived"];

  if (total === 0 && filter === "all" && !loading) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 ring-1 ring-border/50 md:p-10">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-foreground">{t("emptyTitle")}</h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
        <PremiumCta href="/business/programs/new" className="mt-6" showArrow={false}>
          {t("emptyCta")}
        </PremiumCta>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full bg-secondary/60 p-1">
          {filters.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-[220ms] ease-out",
                filter === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`filters.${key}`)}
            </button>
          ))}
        </div>
        <Link
          href="/business/programs/new"
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {t("emptyCta")}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}
