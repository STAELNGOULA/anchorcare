import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.programs.enrolled");
  return { title: t("metaTitle") };
}

export default function ParentProgramsEnrolledPage() {
  return (
    <SurfacePlaceholder
      namespace="parent.programs.enrolled"
      phase="mvp"
      specId="P-21"
      backHref="/parent/programs"
    />
  );
}
