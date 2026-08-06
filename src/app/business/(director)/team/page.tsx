import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeamWorkspace } from "@/components/business/team/team-workspace";
import {
  listPendingCoachInvites,
  listTeamMembers,
  listTeamPrograms,
} from "@/lib/business/team-service";
import { getDirectorContext } from "@/lib/business/director-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.team");
  return { title: t("metaTitle") };
}

export default async function BusinessTeamPage() {
  const { orgId } = await getDirectorContext();
  const t = await getTranslations("business.team");

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("noOrg")}</p>
      </div>
    );
  }

  const [members, pendingInvites, programs] = await Promise.all([
    listTeamMembers(orgId),
    listPendingCoachInvites(orgId),
    listTeamPrograms(orgId),
  ]);

  return (
    <TeamWorkspace
      members={members}
      pendingInvites={pendingInvites}
      programs={programs}
    />
  );
}
