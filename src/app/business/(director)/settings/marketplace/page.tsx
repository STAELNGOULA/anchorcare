import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.marketplaceSurface");
  return { title: t("metaTitle") };
}

export default function Page() {
  return (
    <SurfacePlaceholder
      namespace="business.settings.marketplaceSurface"
      phase="p2"
      specId="B-06 / §6.6"
      backHref="/business/settings"
    />
  );
}
