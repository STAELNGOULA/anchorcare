import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { SettingsHub } from "@/components/settings/settings-hub";
import { getParentContext } from "@/lib/parent/parent-context";
import {
  getParentYouHubHints,
  parentYouGroupsForPlan,
} from "@/lib/settings/parent-you-hub";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you");
  return { title: t("metaTitle") };
}

export default async function ParentYouPage() {
  const context = await getParentContext();
  const [hints, t] = await Promise.all([
    getParentYouHubHints(context.userId),
    getTranslations("parent.you"),
  ]);

  const groups = parentYouGroupsForPlan(context.plan);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <span
          className={cn(
            "inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium",
            context.plan === "family"
              ? "bg-primary/12 text-primary"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {context.plan === "family" ? t("planFamily") : t("planFree")}
        </span>
      </div>
      <SettingsHub
        namespace="parent.you"
        groups={groups}
        hints={hints}
      />
    </div>
  );
}
