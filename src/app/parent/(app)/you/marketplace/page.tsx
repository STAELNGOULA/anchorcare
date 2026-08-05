import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you.marketplace");
  return { title: t("metaTitle") };
}

export default function Page() {
  return (
    <SurfacePlaceholder
      namespace="parent.you.marketplace"
      phase="p2"
      specId="§5.11"
      backHref="/parent/you"
    />
  );
}
