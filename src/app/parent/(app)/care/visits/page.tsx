import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.visits");
  return { title: t("metaTitle") };
}

export default function ParentCareVisitsPage() {
  return (
    <SurfacePlaceholder
      namespace="parent.care.visits"
      phase="mvp"
      specId="P-13"
      backHref="/parent/care"
    />
  );
}
