import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RosterChildDetailView } from "@/components/roster/roster-child-detail";
import { getStaffClearanceSummary } from "@/lib/clearance/clearance-share-service";
import { resolveThreadIdForRegistration } from "@/lib/messaging/messaging-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { getRosterChildDetail } from "@/lib/roster/roster-service";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ registrationId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { registrationId } = await params;
  const t = await getTranslations("roster.detail");
  return { title: t("metaTitle", { id: registrationId.slice(0, 8) }) };
}

export default async function BusinessRosterChildDetailPage({ params }: PageProps) {
  const { registrationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/business/families/children/${registrationId}`);

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const child = await getRosterChildDetail(registrationId, { type: "org", orgId });
  if (!child) notFound();

  const clearanceSummary = await getStaffClearanceSummary(registrationId);
  const threadId = await resolveThreadIdForRegistration(registrationId);
  const messagesHref = threadId ? `/business/messages/${threadId}` : null;

  return (
    <RosterChildDetailView
      child={child}
      backHref="/business/families/children"
      showStaffNotes
      clearanceSummary={clearanceSummary}
      messagesHref={messagesHref}
    />
  );
}
