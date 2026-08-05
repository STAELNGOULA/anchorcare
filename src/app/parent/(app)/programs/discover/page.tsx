import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.programs.discover");
  return { title: t("metaTitle") };
}

export default function ParentProgramsDiscoverPage() {
  return (
    <SurfacePlaceholder
      namespace="parent.programs.discover"
      phase="p2"
      specId="P-03 / §5.3"
      backHref="/parent/programs"
    />
  );
}
