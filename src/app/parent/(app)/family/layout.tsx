import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { FamilyShell } from "@/components/parent/family-shell";

export default async function FamilyLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("parent.family");

  return (
    <FamilyShell title={t("title")} subtitle={t("subtitle")}>
      {children}
    </FamilyShell>
  );
}
