import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.doctors");
  return { title: t("metaTitle") };
}

export default function ParentCareDoctorsPage() {
  return (
    <SurfacePlaceholder
      namespace="parent.care.doctors"
      phase="mvp"
      specId="P-11"
      backHref="/parent/care"
    />
  );
}
