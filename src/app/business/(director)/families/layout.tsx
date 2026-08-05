import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { FamiliesSubnav } from "@/components/business/families-subnav";
import { PageHeader } from "@/components/business/page-header";

export default async function FamiliesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("business.families");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <FamiliesSubnav />
      {children}
    </div>
  );
}
