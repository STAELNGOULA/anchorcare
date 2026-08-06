import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ParentConsultsClient } from "@/components/consults/parent-consults-client";
import { SkeletonList } from "@/components/shared/skeleton-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.consults");
  return { title: t("metaTitle") };
}

export default function ParentCareConsultsPage() {
  return (
    <Suspense fallback={<SkeletonList count={3} />}>
      <ParentConsultsClient />
    </Suspense>
  );
}
