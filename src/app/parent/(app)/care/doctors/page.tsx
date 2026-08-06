import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { DoctorDirectoryClient } from "@/components/doctors/doctor-directory-client";
import { SkeletonList } from "@/components/shared/skeleton-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.doctors");
  return { title: t("metaTitle") };
}

export default function ParentCareDoctorsPage() {
  return (
    <Suspense fallback={<SkeletonList count={4} />}>
      <DoctorDirectoryClient />
    </Suspense>
  );
}
