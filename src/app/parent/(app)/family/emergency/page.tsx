import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentEmergencyWorkspace } from "@/components/emergency/parent-emergency-workspace";
import { listParentEmergencyChildren } from "@/lib/emergency/emergency-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.family.emergency");
  return { title: t("metaTitle") };
}

export default async function ParentEmergencyPage() {
  const context = await getParentContext();
  const children = await listParentEmergencyChildren(context.userId);

  return <ParentEmergencyWorkspace children={children} />;
}
