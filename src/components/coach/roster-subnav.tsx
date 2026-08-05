"use client";

import { useTranslations } from "next-intl";
import { HubSubnav } from "@/components/shared/hub-subnav";

const ROSTER_TABS = [
  { key: "standard", href: "/coach/roster", exact: true },
  { key: "field", href: "/coach/roster/field" },
] as const;

export function RosterSubnav() {
  const t = useTranslations("coach.roster.tabs");

  return (
    <HubSubnav
      tabs={ROSTER_TABS}
      ariaLabel={t("label")}
      getLabel={(key) => t(key)}
    />
  );
}
