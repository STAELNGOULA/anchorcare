import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { CoachUserMenu } from "@/components/coach/coach-user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { CoachContext } from "@/lib/coach/coach-context";
import { cn } from "@/lib/utils";

type CoachTopBarProps = {
  context: CoachContext;
  className?: string;
};

export async function CoachTopBar({ context, className }: CoachTopBarProps) {
  const t = await getTranslations("coach");

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
            href="/coach/programs"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AnchorLogo showWordmark={false} />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate font-display text-sm text-foreground md:text-base">
              {context.workspaceLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {context.isDirectorMode ? (
            <Link
              href="/business/dashboard"
              className="hidden min-h-9 items-center rounded-full px-3 text-xs font-medium text-muted-foreground ring-1 ring-border/60 transition-colors duration-300 ease-premium hover:text-foreground md:inline-flex"
            >
              {t("directorMode")}
            </Link>
          ) : null}
          <ThemeToggle variant="pill" />
          <CoachUserMenu email={context.email} />
        </div>
      </div>
    </header>
  );
}
