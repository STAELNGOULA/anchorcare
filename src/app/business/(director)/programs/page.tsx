import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProgramList } from "@/components/business/programs/program-list";
import { PageHeader } from "@/components/business/page-header";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { listProgramsForDirector } from "@/lib/business/program-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.programs");
  return { title: t("metaTitle") };
}

export default async function BusinessProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/business/programs");

  const result = await listProgramsForDirector(user.id);
  if (!result) redirect("/business/onboarding");

  const t = await getTranslations("business.programs");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        {result.total > 0 ? (
          <PremiumCta href="/business/programs/new" showArrow={false}>
            {t("emptyCta")}
          </PremiumCta>
        ) : null}
      </div>
      <ProgramList initialPrograms={result.programs} initialTotal={result.total} />
    </div>
  );
}
