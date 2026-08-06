import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { DoctorDetailClient } from "@/components/doctors/doctor-detail-client";
import { SkeletonList } from "@/components/shared/skeleton-list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("parent.care.doctors.detail");
  return { title: t("metaTitle", { id }) };
}

export default async function ParentCareDoctorDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SkeletonList count={1} />}>
      <DoctorDetailClient doctorId={id} />
    </Suspense>
  );
}
