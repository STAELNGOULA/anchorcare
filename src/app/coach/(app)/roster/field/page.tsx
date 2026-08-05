import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.roster.field");
  return { title: t("metaTitle") };
}

export default function CoachRosterFieldPage() {
  return (
    <SurfacePlaceholder
      namespace="coach.roster.field"
      phase="p15"
      specId="B-03b / §6.11"
      backHref="/coach/roster"
    />
  );
}
