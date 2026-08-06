import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ParentConsultDetailClient } from "@/components/consults/parent-consult-detail-client";
import { SkeletonList } from "@/components/shared/skeleton-list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.consults.detail");
  return { title: t("metaTitle") };
}

export default async function ParentCareConsultDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SkeletonList count={1} />}>
      <ParentConsultDetailClient consultId={id} />
    </Suspense>
  );
}
