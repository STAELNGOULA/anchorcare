"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";
import { cn } from "@/lib/utils";

type CoachReportNavStripProps = {
  programs: ProgramListItem[];
  programId: string;
  active: "voice" | "media" | "review";
};

export function CoachReportNavStrip({
  programs,
  programId,
  active,
}: CoachReportNavStripProps) {
  const t = useTranslations("coach.report.nav");

  const links = [
    { key: "voice" as const, href: `/coach/report/${programId}/voice`, label: t("voice") },
    { key: "media" as const, href: `/coach/report/${programId}/media`, label: t("media") },
    { key: "review" as const, href: `/coach/report/${programId}/review`, label: t("review") },
  ];

  return (
    <div className="space-y-3">
      {programs.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {programs.map((p) => (
            <Link
              key={p.id}
              href={`/coach/report/${p.id}/${active}`}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs",
                p.id === programId
                  ? "bg-foreground text-background"
                  : "text-muted-foreground ring-1 ring-border/60",
              )}
            >
              {p.name}
            </Link>
          ))}
        </div>
      ) : null}
      <nav
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t("label")}
      >
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={cn(
              "shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-200 ease-out",
              active === link.key
                ? "bg-primary/12 text-primary"
                : "bg-card text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
