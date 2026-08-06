import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvitesWorkspace } from "@/components/business/invites/invites-workspace";
import { listProgramsForDirector } from "@/lib/business/program-service";
import {
  getAdoptionStats,
  getDirectorOrgId,
  listInvitesForOrg,
} from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.invites");
  return { title: t("metaTitle") };
}

export default async function BusinessInvitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/settings/invites");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const [programsResult, invitesResult, adoption] = await Promise.all([
    listProgramsForDirector(user.id, { status: "all", pageSize: 50 }),
    listInvitesForOrg(orgId),
    getAdoptionStats(orgId),
  ]);

  return (
    <InvitesWorkspace
      programs={programsResult?.programs ?? []}
      initialInvites={invitesResult.items}
      adoption={adoption}
    />
  );
}
