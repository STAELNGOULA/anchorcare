import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { BusinessIncidentsWorkspace } from "@/components/business/reports/business-incidents-workspace";
import { PageHeader } from "@/components/business/page-header";
import { listProgramsForDirector } from "@/lib/business/program-service";
import { listIncidentsForOrg } from "@/lib/incidents/incident-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.reports");
  return { title: t("metaTitle") };
}

export default async function BusinessReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/business/reports");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const programsResult = await listProgramsForDirector(user.id, {
    status: "all",
    pageSize: 100,
  });
  const { items, hasMore } = await listIncidentsForOrg(orgId);
  const t = await getTranslations("business.reports");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <BusinessIncidentsWorkspace
        programs={programsResult?.programs ?? []}
        initialItems={items}
        initialHasMore={hasMore}
      />
    </div>
  );
}
