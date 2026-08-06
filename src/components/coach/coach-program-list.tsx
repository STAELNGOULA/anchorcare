"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";

type CoachProgramListProps = {
  programs: ProgramListItem[];
};

export function CoachProgramList({ programs }: CoachProgramListProps) {
  const t = useTranslations("coach.programs");

  if (programs.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 ring-1 ring-border/50">
        <h2 className="font-display text-2xl text-foreground">{t("emptyTitle")}</h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">{t("emptyBody")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => (
        <Link
          key={program.id}
          href={`/coach/report/${program.id}/voice`}
          className="block rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50 transition-[transform] duration-[220ms] ease-out hover:-translate-y-0.5"
        >
          <p className="font-display text-lg text-foreground">{program.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{program.priceDisplay}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("enrollment", { count: program.enrollmentCount })}
          </p>
        </Link>
      ))}
    </div>
  );
}
