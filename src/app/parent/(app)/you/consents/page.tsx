import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentConsentsWorkspace } from "@/components/consents/parent-consents-workspace";
import {
  getParentNotificationPreferences,
  listParentProgramConsents,
} from "@/lib/consents/consent-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you.consents");
  return { title: t("metaTitle") };
}

export default async function ParentConsentsPage() {
  const context = await getParentContext();
  const [programs, notifications] = await Promise.all([
    listParentProgramConsents(context.userId),
    getParentNotificationPreferences(context.userId),
  ]);

  return (
    <ParentConsentsWorkspace
      programs={programs}
      notifications={notifications}
    />
  );
}
