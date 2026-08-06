import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoparentWorkspace } from "@/components/parent/coparent/coparent-workspace";
import { getCoparentWorkspaceData } from "@/lib/coparent/coparent-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.family.coparent");
  return { title: t("metaTitle") };
}

export default async function Page() {
  const context = await getParentContext();
  const data = await getCoparentWorkspaceData(context.userId);

  return <CoparentWorkspace initialData={data} />;
}
