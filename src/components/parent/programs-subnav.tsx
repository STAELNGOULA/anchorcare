"use client";

import { useTranslations } from "next-intl";
import { HubSubnav } from "@/components/shared/hub-subnav";

const PROGRAMS_TABS = [
  { key: "enrolled", href: "/parent/programs/enrolled" },
  { key: "discover", href: "/parent/programs/discover" },
] as const;

export function ProgramsSubnav() {
  const t = useTranslations("parent.programs.tabs");

  return (
    <HubSubnav
      tabs={PROGRAMS_TABS}
      ariaLabel={t("label")}
      getLabel={(key) => t(key)}
    />
  );
}
