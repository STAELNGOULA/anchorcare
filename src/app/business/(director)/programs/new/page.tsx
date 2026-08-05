import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.programs.new");
  return { title: t("metaTitle") };
}

export default function BusinessProgramsNewPage() {
  return (
    <SurfacePlaceholder
      namespace="business.programs.new"
      phase="mvp"
      specId="B-02 / §6.2"
      backHref="/business/programs"
    />
  );
}
