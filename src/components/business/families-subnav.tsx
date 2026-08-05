"use client";

import { useTranslations } from "next-intl";
import { HubSubnav } from "@/components/shared/hub-subnav";

const FAMILIES_TABS = [
  { key: "children", href: "/business/families/children" },
  { key: "parents", href: "/business/families/parents" },
] as const;

export function FamiliesSubnav() {
  const t = useTranslations("business.families.tabs");

  return (
    <HubSubnav
      tabs={FAMILIES_TABS}
      ariaLabel={t("label")}
      getLabel={(key) => t(key)}
    />
  );
}
