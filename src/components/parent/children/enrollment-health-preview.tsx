"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";
import { HealthCompletenessBadge } from "@/components/parent/children/health-completeness-badge";
import type { ParentChildOption } from "@/lib/invites/types";
import { computeHealthScore } from "@/lib/parent/child-health-score";

type EnrollmentHealthPreviewProps = {
  child: ParentChildOption | null;
};

export function EnrollmentHealthPreview({ child }: EnrollmentHealthPreviewProps) {
  const t = useTranslations("public.bookPay.healthProfile");

  if (!child) return null;

  const medications = Array.isArray(child.medications)
    ? (child.medications as { name?: string }[])
        .filter((m) => typeof m.name === "string" && m.name.trim())
        .map((m) => m.name as string)
    : [];

  const score = computeHealthScore({
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth,
    allergyItems: [],
    allergies: child.allergies,
    medications: medications.map((name) => ({ name, dose: "", schedule: "" })),
    medicalConditions: child.medicalConditions,
    emergencyContacts: [],
    physicianName: null,
    physicianPhone: null,
    photoUrl: null,
  });

  if (score >= 80) return null;

  return (
    <BezelCard className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <HealthCompletenessBadge score={score} showLabel={false} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("body")}</p>
      {child.allergies ? (
        <p className="text-xs text-foreground">
          <span className="font-medium">{t("allergies")}: </span>
          {child.allergies}
        </p>
      ) : null}
      {medications.length > 0 ? (
        <p className="text-xs text-foreground">
          <span className="font-medium">{t("medications")}: </span>
          {medications.join(", ")}
        </p>
      ) : null}
      <Link
        href={`/parent/family/children/${child.id}?tab=health`}
        className="inline-flex text-xs font-medium text-primary hover:underline"
      >
        {t("completeLink")} →
      </Link>
    </BezelCard>
  );
}
