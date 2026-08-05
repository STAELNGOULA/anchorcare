import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.staff");
  return { title: t("metaTitle") };
}

export default function Page() {
  return (
    <SurfacePlaceholder
      namespace="business.settings.staff"
      phase="mvp"
      specId="B-19"
      backHref="/business/settings"
    />
  );
}
