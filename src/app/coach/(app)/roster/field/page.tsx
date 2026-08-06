import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FieldRosterWorkspace } from "@/components/roster/field-roster-workspace";
import { getCoachContext } from "@/lib/coach/coach-context";
import { getCoachOrgId, listRosterForCoach } from "@/lib/roster/roster-service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("coach.roster.field");
  return { title: t("metaTitle") };
}

export default async function CoachRosterFieldPage() {
  const context = await getCoachContext();

  if (context.role !== "coach") {
    const t = await getTranslations("coach.roster.field");
    return <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>;
  }

  const orgId = await getCoachOrgId(context.userId);
  const { items, total, programs } = orgId
    ? await listRosterForCoach(context.userId, orgId)
    : { items: [], total: 0, programs: [] };

  return (
    <FieldRosterWorkspace
      mode="coach"
      initialItems={items}
      initialTotal={total}
      programs={programs}
    />
  );
}
