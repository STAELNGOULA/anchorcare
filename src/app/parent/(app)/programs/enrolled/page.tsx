import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EnrolledProgramsClient } from "@/components/parent/programs/enrolled-programs-client";
import { listEnrolledProgramsForParent } from "@/lib/registrations/registration-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.programs.enrolled");
  return { title: t("metaTitle") };
}

export default async function ParentProgramsEnrolledPage() {
  const context = await getParentContext();
  const programs = await listEnrolledProgramsForParent(context.userId);

  return (
    <Suspense fallback={null}>
      <EnrolledProgramsClient programs={programs} />
    </Suspense>
  );
}
