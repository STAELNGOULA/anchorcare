import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SurfacePlaceholder } from "@/components/shared/surface-placeholder";
import type { BuildPhase } from "@/lib/navigation/phases";

type FamilyTab = "children" | "emergency" | "pickups" | "forms" | "coparent";

const FAMILY_TAB_PHASE: Record<FamilyTab, BuildPhase> = {
  children: "mvp",
  emergency: "mvp",
  pickups: "mvp",
  forms: "mvp",
  coparent: "mvp",
};

const FAMILY_TAB_SPEC: Record<FamilyTab, string> = {
  children: "P-18",
  emergency: "P-19",
  pickups: "P-20",
  forms: "P-25",
  coparent: "P-26",
};

type FamilyTabPageProps = {
  tab: FamilyTab;
};

export async function familyTabMetadata(tab: FamilyTab): Promise<Metadata> {
  const t = await getTranslations(`parent.family.${tab}`);
  return { title: t("metaTitle") };
}

export async function FamilyTabPage({ tab }: FamilyTabPageProps) {
  return (
    <SurfacePlaceholder
      namespace={`parent.family.${tab}`}
      phase={FAMILY_TAB_PHASE[tab]}
      specId={FAMILY_TAB_SPEC[tab]}
      backHref="/parent/family/children"
    />
  );
}
