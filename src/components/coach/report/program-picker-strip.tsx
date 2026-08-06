"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";
import { cn } from "@/lib/utils";

type ProgramPickerStripProps = {
  programs: ProgramListItem[];
  activeProgramId: string;
};

export function ProgramPickerStrip({
  programs,
  activeProgramId,
}: ProgramPickerStripProps) {
  const t = useTranslations("coach.report.voice");

  if (programs.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {t("programPicker")}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {programs.map((program) => {
          const active = program.id === activeProgramId;
          return (
            <Link
              key={program.id}
              href={`/coach/report/${program.id}/voice`}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98]",
                active
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
              )}
            >
              {program.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
