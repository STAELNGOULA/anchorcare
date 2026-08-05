import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { DirectorUserMenu } from "@/components/business/director-user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { directorHeader } from "@/lib/business/layout";
import type { DirectorContext } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type OrgBarProps = {
  context: DirectorContext;
};

export async function OrgBar({ context }: OrgBarProps) {
  const t = await getTranslations("business");

  return (
    <header className={cn(directorHeader, "justify-between lg:justify-end")}>
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <Link
          href="/business/dashboard"
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AnchorLogo showWordmark={false} />
        </Link>
        <p className="truncate font-display text-base text-foreground">
          {context.orgName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {context.trialActive ? (
          <span className="rounded-md bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
            {t("trialBadge", { days: context.trialDaysLeft })}
          </span>
        ) : null}
        <Link
          href="/coach/programs"
          className="hidden min-h-9 items-center rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-300 ease-premium hover:bg-secondary/80 hover:text-foreground sm:inline-flex lg:hidden"
        >
          {t("coachMode")}
        </Link>
        <ThemeToggle />
        <DirectorUserMenu email={context.email} />
      </div>
    </header>
  );
}
