import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.shop");
  return { title: t("metaTitle") };
}

export default async function BusinessShopPage() {
  const t = await getTranslations("business.shop");

  return (
    <div className="space-y-8">
      <SurfacePlaceholder namespace="business.shop" phase="p2" specId="§6.6" />
    </div>
  );
}
