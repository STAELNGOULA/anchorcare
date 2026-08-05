"use client";

import { useTranslations } from "next-intl";
import { HubSubnav } from "@/components/shared/hub-subnav";

const PEOPLE_TABS = [
  { key: "children", href: "/business/people/children" },
  { key: "parents", href: "/business/people/parents" },
  { key: "coaches", href: "/business/people/coaches" },
] as const;

export function PeopleSubnav() {
  const t = useTranslations("business.people.tabs");

  return (
    <HubSubnav
      tabs={PEOPLE_TABS}
      ariaLabel={t("label")}
      getLabel={(key) => t(key)}
    />
  );
}
