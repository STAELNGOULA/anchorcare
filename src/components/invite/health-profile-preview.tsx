"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Pill, Stethoscope } from "lucide-react";
import type { ParentChildOption } from "@/lib/invites/types";
import { cn } from "@/lib/utils";

type HealthProfilePreviewProps = {
  child: ParentChildOption | null;
  className?: string;
};

function medicationSummary(medications: unknown): string | null {
  if (!Array.isArray(medications) || medications.length === 0) return null;
  const names = medications
    .map((item) => {
      if (item && typeof item === "object" && "name" in item) {
        return String((item as { name?: string }).name ?? "");
      }
      return "";
    })
    .filter(Boolean);
  return names.length ? names.join(", ") : null;
}

export function HealthProfilePreview({ child, className }: HealthProfilePreviewProps) {
  const t = useTranslations("auth.inviteFlow");

  if (!child) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {t("healthPreviewEmpty")}
      </p>
    );
  }

  const meds = medicationSummary(child.medications);

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-border/50 bg-background/50 p-4 text-sm",
        className,
      )}
    >
      <p className="font-medium text-foreground">{t("healthPreviewTitle")}</p>

      <div className="space-y-2 text-muted-foreground">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p>
            <span className="text-foreground">{t("allergies")}: </span>
            {child.allergies?.trim() || t("noneListed")}
          </p>
        </div>
        <div className="flex gap-2">
          <Pill className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="text-foreground">{t("medications")}: </span>
            {meds || t("noneListed")}
          </p>
        </div>
        <div className="flex gap-2">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="text-foreground">{t("conditions")}: </span>
            {child.medicalConditions?.trim() || t("noneListed")}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("healthPreviewNote")}</p>
    </div>
  );
}
