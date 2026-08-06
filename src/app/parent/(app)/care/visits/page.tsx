import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { VisitListClient } from "@/components/visits/visit-list-client";
import { SkeletonList } from "@/components/shared/skeleton-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.visits");
  return { title: t("metaTitle") };
}

export default function ParentCareVisitsPage() {
  return (
    <Suspense fallback={<SkeletonList count={4} />}>
      <VisitListClient />
    </Suspense>
  );
}
