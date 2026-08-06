import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentAccountWorkspace } from "@/components/parent/you/parent-account-workspace";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you.account");
  return { title: t("metaTitle") };
}

export default async function ParentAccountPage() {
  const context = await getParentContext();

  return (
    <ParentAccountWorkspace
      email={context.email}
      displayName={context.displayName}
    />
  );
}
