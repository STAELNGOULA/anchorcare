import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentPickupsWorkspace } from "@/components/parent/pickups/parent-pickups-workspace";
import { listParentPickupChildren } from "@/lib/pickups/pickup-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.family.pickups");
  return { title: t("metaTitle") };
}

export default async function ParentPickupsPage() {
  const context = await getParentContext();
  const children = await listParentPickupChildren(context.userId);

  return <ParentPickupsWorkspace children={children} />;
}
