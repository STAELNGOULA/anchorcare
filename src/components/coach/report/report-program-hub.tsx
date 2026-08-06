"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";

type ReportProgramHubProps = {
  programs: ProgramListItem[];
};

export function ReportProgramHub({ programs }: ReportProgramHubProps) {
  const t = useTranslations("coach.report");

  if (programs.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 ring-1 ring-border/50">
        <h2 className="font-display text-2xl text-foreground">{t("emptyTitle")}</h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">{t("emptyBody")}</p>
        <Link
          href="/coach/programs"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          {t("emptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => (
        <Link
          key={program.id}
          href={`/coach/report/${program.id}/voice`}
          className="group block rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50 transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg text-foreground">{program.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("hub.enrollment", { count: program.enrollmentCount })}
              </p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
              <Mic className="size-5" aria-hidden />
            </span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t("hub.recordCta")}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="text-primary">{t("hub.mediaCta")}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-primary">{t("hub.reviewCta")}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
