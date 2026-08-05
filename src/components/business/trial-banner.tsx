import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { DirectorContext } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type TrialBannerProps = {
  context: Pick<DirectorContext, "trialActive" | "trialDaysLeft">;
};

export async function TrialBanner({ context }: TrialBannerProps) {
  const t = await getTranslations("business");

  if (!context.trialActive) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[1.25rem] border border-primary/25 bg-primary/8 px-5 py-4 md:flex-row md:items-center md:justify-between",
      )}
    >
      <div>
        <p className="font-display text-lg text-foreground">
          {t("trialBannerTitle", { days: context.trialDaysLeft })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("trialBannerBody")}
        </p>
      </div>
      <Link
        href="/business/settings"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-[transform,background-color] duration-300 ease-premium hover:bg-primary/92 active:scale-[0.98]"
      >
        {t("trialBannerCta")}
      </Link>
    </div>
  );
}
