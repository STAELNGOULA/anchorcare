"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";
import { cn } from "@/lib/utils";

type ProgramCardProps = {
  program: ProgramListItem;
};

const STATUS_STYLES = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  draft: "bg-secondary text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
} as const;

export function ProgramCard({ program }: ProgramCardProps) {
  const t = useTranslations("business.programs.card");

  const spots =
    program.capacity != null
      ? t("enrollment", {
          count: program.enrollmentCount,
          capacity: program.capacity,
        })
      : t("enrollmentOpen", { count: program.enrollmentCount });

  return (
    <Link
      href={`/business/programs/${program.id}`}
      className={cn(
        "group block rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
        "transition-[transform,box-shadow] duration-[220ms] ease-out",
        "hover:-translate-y-0.5 hover:shadow-sm",
        "active:scale-[0.99]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-display text-lg leading-tight text-foreground">{program.name}</p>
          <p className="text-sm text-muted-foreground">{program.priceDisplay}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
            STATUS_STYLES[program.status],
          )}
        >
          {t(`status.${program.status}`)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{spots}</span>
        {program.publicListingEnabled ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            {t("publicBadge")}
          </span>
        ) : null}
        {program.priceAmountCents > 0 && !program.stripeConnectOnboarded ? (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
            {t("connectNeeded")}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
