"use client";

import { useTranslations } from "next-intl";
import { HubSubnav } from "@/components/shared/hub-subnav";

const FAMILY_TABS = [
  { key: "children", href: "/parent/family/children" },
  { key: "emergency", href: "/parent/family/emergency" },
  { key: "pickups", href: "/parent/family/pickups" },
  { key: "coparent", href: "/parent/family/coparent" },
] as const;

export function FamilySubnav() {
  const t = useTranslations("parent.family.tabs");

  return (
    <HubSubnav
      tabs={FAMILY_TABS}
      ariaLabel={t("label")}
      getLabel={(key) => t(key)}
    />
  );
}
