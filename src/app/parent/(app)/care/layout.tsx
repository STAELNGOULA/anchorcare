import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { CareSubnav } from "@/components/parent/care-subnav";

export default async function CareLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("parent.care");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CareSubnav />
      {children}
    </div>
  );
}
