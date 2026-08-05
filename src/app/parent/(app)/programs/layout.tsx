import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { ProgramsSubnav } from "@/components/parent/programs-subnav";

export default async function ProgramsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("parent.programs");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ProgramsSubnav />
      {children}
    </div>
  );
}
