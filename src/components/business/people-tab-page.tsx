import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SectionEmpty } from "@/components/business/section-empty";

type PeopleTab = "children" | "parents" | "coaches";

type PeopleTabPageProps = {
  tab: PeopleTab;
};

export async function peopleTabMetadata(tab: PeopleTab): Promise<Metadata> {
  const t = await getTranslations("business.people");
  return { title: t(`${tab}.metaTitle`) };
}

export async function PeopleTabPage({ tab }: PeopleTabPageProps) {
  const t = await getTranslations("business.people");

  return (
    <SectionEmpty
      title={t(`${tab}.emptyTitle`)}
      body={t(`${tab}.emptyBody`)}
      cta={{ href: "/business/settings", label: t(`${tab}.emptyCta`) }}
    />
  );
}
