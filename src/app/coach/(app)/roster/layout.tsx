import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { RosterSubnav } from "@/components/coach/roster-subnav";

export default async function RosterLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("coach.roster");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <RosterSubnav />
      {children}
    </div>
  );
}
