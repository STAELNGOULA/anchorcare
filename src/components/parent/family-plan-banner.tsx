import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { ParentContext } from "@/lib/parent/parent-context";

type FamilyPlanBannerProps = {
  context: Pick<ParentContext, "plan">;
};

export async function FamilyPlanBanner({ context }: FamilyPlanBannerProps) {
  if (context.plan !== "free") return null;

  const t = await getTranslations("parent.today");

  return (
    <BezelCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
      <div className="space-y-1">
        <p className="font-display text-lg text-foreground">{t("planBannerTitle")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("planBannerBody")}
        </p>
      </div>
      <Link
        href="/parent/you/subscription"
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-[transform,background-color] duration-300 ease-premium hover:bg-primary/90 active:scale-[0.98]"
      >
        {t("planBannerCta")}
      </Link>
    </BezelCard>
  );
}
