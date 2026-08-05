import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SectionEmpty } from "@/components/business/section-empty";

type FamiliesTab = "children" | "parents";

type FamiliesTabPageProps = {
  tab: FamiliesTab;
};

export async function familiesTabMetadata(tab: FamiliesTab): Promise<Metadata> {
  const t = await getTranslations("business.families");
  return { title: t(`${tab}.metaTitle`) };
}

export async function FamiliesTabPage({ tab }: FamiliesTabPageProps) {
  const t = await getTranslations("business.families");

  return (
    <SectionEmpty
      title={t(`${tab}.emptyTitle`)}
      body={t(`${tab}.emptyBody`)}
      cta={{ href: "/business/settings/invites", label: t(`${tab}.emptyCta`) }}
    />
  );
}
