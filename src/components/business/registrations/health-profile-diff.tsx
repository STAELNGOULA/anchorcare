"use client";

import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { HealthSnapshot } from "@/lib/registrations/types";

type HealthProfileDiffProps = {
  snapshot: HealthSnapshot;
};

export function HealthProfileDiff({ snapshot }: HealthProfileDiffProps) {
  const t = useTranslations("business.families.registrations.healthDiff");

  const lines = [
    snapshot.allergies
      ? `${t("allergies")}: ${snapshot.allergies}`
      : null,
    snapshot.medications.length
      ? `${t("medications")}: ${snapshot.medications.map((m) => m.name).join(", ")}`
      : null,
    snapshot.medicalConditions
      ? `${t("conditions")}: ${snapshot.medicalConditions}`
      : null,
    snapshot.emergencyContacts.length
      ? `${t("emergency")}: ${snapshot.emergencyContacts.map((c) => c.name).join(", ")}`
      : null,
  ].filter(Boolean);

  if (lines.length === 0) {
    return (
      <BezelCard className="p-4 text-sm text-muted-foreground">{t("noSnapshot")}</BezelCard>
    );
  }

  return (
    <BezelCard className="space-y-2 p-4">
      <p className="text-sm font-medium text-foreground">{t("title")}</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </BezelCard>
  );
}
