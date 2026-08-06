import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { CoachIncidentsList } from "@/components/coach/incidents/coach-incidents-list";
import { PageHeader } from "@/components/business/page-header";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { listIncidentsForCoach } from "@/lib/incidents/incident-service";
import { getCoachContext } from "@/lib/coach/coach-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.incidents");
  return { title: t("metaTitle") };
}

export default async function CoachIncidentsPage() {
  const { userId } = await getCoachContext();
  const t = await getTranslations("coach.incidents");

  const { items, hasMore } = await listIncidentsForCoach(userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <PremiumCta href="/coach/incidents/new" showArrow={false}>
          {t("list.reportCta")}
        </PremiumCta>
      </div>
      <CoachIncidentsList initialItems={items} initialHasMore={hasMore} />
    </div>
  );
}
