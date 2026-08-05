import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { DirectorUserMenu } from "@/components/business/director-user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { DirectorContext } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type OrgBarProps = {
  context: DirectorContext;
  className?: string;
};

export async function OrgBar({ context, className }: OrgBarProps) {
  const t = await getTranslations("business");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 bg-background/80 pt-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 md:pt-5",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between gap-3",
          "rounded-full border border-border/50 bg-background/80 px-3 py-2 pl-4 shadow-[0_20px_60px_-24px_rgba(15,42,61,0.15)]",
          "backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/business/dashboard"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AnchorLogo showWordmark={false} />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate font-display text-sm text-foreground md:text-base">
              {context.orgName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {context.trialActive ? (
            <span className="hidden rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent md:inline-flex">
              {t("trialBadge", { days: context.trialDaysLeft })}
            </span>
          ) : null}
          <Link
            href="/business/shop"
            className="hidden min-h-9 items-center rounded-full px-3 text-xs font-medium text-muted-foreground ring-1 ring-border/60 transition-colors duration-300 ease-premium hover:text-foreground md:inline-flex"
          >
            {t("shopLink")}
          </Link>
          <Link
            href="/business/settings"
            className="hidden min-h-9 items-center rounded-full px-3 text-xs font-medium text-muted-foreground ring-1 ring-border/60 transition-colors duration-300 ease-premium hover:text-foreground md:inline-flex"
          >
            {t("settingsLink")}
          </Link>
          <Link
            href="/coach/programs"
            className="hidden min-h-9 items-center rounded-full px-3 text-xs font-medium text-muted-foreground ring-1 ring-border/60 transition-colors duration-300 ease-premium hover:text-foreground md:inline-flex"
          >
            {t("coachMode")}
          </Link>
          <ThemeToggle variant="pill" />
          <DirectorUserMenu email={context.email} />
        </div>
      </div>
    </header>
  );
}
