import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { RosterWorkspace } from "@/components/roster/roster-workspace";
import { getCoachContext } from "@/lib/coach/coach-context";
import { getCoachOrgId, listRosterForCoach } from "@/lib/roster/roster-service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.roster");
  return { title: t("metaTitle") };
}

export default async function CoachRosterPage() {
  const t = await getTranslations("coach.roster");
  const context = await getCoachContext();

  if (context.role !== "coach") {
    return (
      <div className="space-y-8 md:space-y-10">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
      </div>
    );
  }

  const orgId = await getCoachOrgId(context.userId);
  const { items, total, programs } = orgId
    ? await listRosterForCoach(context.userId, orgId)
    : { items: [], total: 0, programs: [] };

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <RosterWorkspace
        mode="coach"
        initialItems={items}
        initialTotal={total}
        programs={programs}
        detailBasePath="/coach/roster"
      />
    </div>
  );
}
