import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HandoffWorkspace } from "@/components/handoff/handoff-workspace";
import { listHandoffNotesForOrg } from "@/lib/handoff/handoff-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { listRosterForOrg } from "@/lib/roster/roster-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.handoff");
  return { title: t("metaTitle") };
}

export default async function BusinessHandoffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/roster/handoff");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const [{ programs }, notes] = await Promise.all([
    listRosterForOrg(orgId, { page: 1 }),
    listHandoffNotesForOrg(orgId),
  ]);

  return <HandoffWorkspace programs={programs} initialNotes={notes} />;
}
