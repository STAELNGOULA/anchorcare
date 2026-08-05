import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { SectionEmpty } from "@/components/business/section-empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.team");
  return { title: t("metaTitle") };
}

export default async function BusinessTeamPage() {
  const t = await getTranslations("business.team");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SectionEmpty
        title={t("emptyTitle")}
        body={t("emptyBody")}
        cta={{ href: "/business/settings/staff", label: t("emptyCta") }}
      />
    </div>
  );
}
