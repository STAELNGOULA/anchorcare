import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you.subscription");
  return { title: t("metaTitle") };
}

export default function Page() {
  return (
    <SurfacePlaceholder
      namespace="parent.you.subscription"
      phase="mvp"
      specId="P-27"
      backHref="/parent/you"
    />
  );
}
