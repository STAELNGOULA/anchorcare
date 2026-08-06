import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RosterChildDetailView } from "@/components/roster/roster-child-detail";
import { getStaffClearanceSummary } from "@/lib/clearance/clearance-share-service";
import { resolveThreadIdForRegistration } from "@/lib/messaging/messaging-service";
import { getCoachContext } from "@/lib/coach/coach-context";
import { getCoachOrgId, getRosterChildDetail } from "@/lib/roster/roster-service";

type PageProps = { params: Promise<{ registrationId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("roster.detail");
  return { title: t("metaTitle", { id: "" }) };
}

export default async function CoachRosterChildDetailPage({ params }: PageProps) {
  const { registrationId } = await params;
  const context = await getCoachContext();

  if (context.role !== "coach") {
    redirect("/coach/roster");
  }

  const orgId = await getCoachOrgId(context.userId);
  if (!orgId) notFound();

  const child = await getRosterChildDetail(registrationId, {
    type: "coach",
    userId: context.userId,
    orgId,
  });
  if (!child) notFound();

  const clearanceSummary = await getStaffClearanceSummary(registrationId);
  const threadId = await resolveThreadIdForRegistration(registrationId);
  const messagesHref = threadId ? `/coach/messages/${threadId}` : null;

  return (
    <RosterChildDetailView
      child={child}
      backHref="/coach/roster"
      clearanceSummary={clearanceSummary}
      messagesHref={messagesHref}
    />
  );
}
