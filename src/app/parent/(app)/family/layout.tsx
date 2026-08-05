import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { FamilySubnav } from "@/components/parent/family-subnav";

export default async function FamilyLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("parent.family");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <FamilySubnav />
      {children}
    </div>
  );
}
