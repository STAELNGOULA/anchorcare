import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { VisitDetailClient } from "@/components/visits/visit-detail-client";
import { SkeletonList } from "@/components/shared/skeleton-list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.visits.detail");
  return { title: t("metaTitle") };
}

export default async function ParentCareVisitDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SkeletonList count={1} />}>
      <VisitDetailClient visitId={id} />
    </Suspense>
  );
}
