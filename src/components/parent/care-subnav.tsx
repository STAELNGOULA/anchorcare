"use client";

import { useTranslations } from "next-intl";
import { HubSubnav } from "@/components/shared/hub-subnav";

const CARE_TABS = [
  { key: "doctors", href: "/parent/care/doctors" },
  { key: "visits", href: "/parent/care/visits" },
  { key: "consults", href: "/parent/care/consults" },
  { key: "clearance", href: "/parent/care/clearance" },
] as const;

export function CareSubnav() {
  const t = useTranslations("parent.care.tabs");

  return (
    <HubSubnav
      tabs={CARE_TABS}
      ariaLabel={t("label")}
      getLabel={(key) => t(key)}
    />
  );
}
