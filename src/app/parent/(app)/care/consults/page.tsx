import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.consults");
  return { title: t("metaTitle") };
}

export default function ParentCareConsultsPage() {
  return (
    <SurfacePlaceholder
      namespace="parent.care.consults"
      phase="mvp"
      specId="P-15"
      backHref="/parent/care"
    />
  );
}
