"use client";

import { useTranslations } from "next-intl";
import type { AllergyItem } from "@/lib/parent/child-types";
import {
  SEVERITY_CHIP_CLASS,
  SEVERITY_STRIP_CLASS,
  worstAllergySeverity,
} from "@/lib/roster/allergy-utils";
import { cn } from "@/lib/utils";

type AllergySeverityStripProps = {
  items: AllergyItem[];
  allergiesText?: string | null;
  compact?: boolean;
  className?: string;
};

export function AllergySeverityStrip({
  items,
  allergiesText,
  compact = false,
  className,
}: AllergySeverityStripProps) {
  const t = useTranslations("roster.allergies");

  const worst = worstAllergySeverity(items);
  const hasStructured = items.length > 0;
  const hasText = Boolean(allergiesText?.trim());

  if (!hasStructured && !hasText) {
    return (
      <p
        className={cn(
          "text-xs text-muted-foreground",
          compact && "truncate",
          className,
        )}
      >
        {t("none")}
      </p>
    );
  }

  if (hasStructured) {
    return (
      <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
        <div
          className="flex h-1 w-full min-w-[4rem] overflow-hidden rounded-full"
          role="img"
          aria-label={t("severityStrip", { severity: worst ?? "mild" })}
        >
          {items.map((item) => (
            <span
              key={item.name}
              className={cn("h-full flex-1", SEVERITY_STRIP_CLASS[item.severity])}
              title={`${item.name} (${t(`severity.${item.severity}`)})`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <span
              key={item.name}
              className={cn(
                "inline-flex max-w-full items-center truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                SEVERITY_CHIP_CLASS[item.severity],
              )}
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <p className={cn("text-xs text-foreground", compact && "line-clamp-2", className)}>
      {allergiesText}
    </p>
  );
}
