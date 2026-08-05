import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AdminContext } from "@/lib/admin/admin-context";
import { cn } from "@/lib/utils";

type AdminTopBarProps = {
  context: AdminContext;
  className?: string;
};

export async function AdminTopBar({ context, className }: AdminTopBarProps) {
  const t = await getTranslations("admin");

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
            href="/admin/dashboard"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AnchorLogo showWordmark={false} />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate font-display text-sm text-foreground md:text-base">
              {t("platformLabel")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {context.pendingConsults > 0 ? (
            <Link
              href="/admin/consults"
              className="hidden rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent transition-colors duration-300 ease-premium hover:bg-accent/20 md:inline-flex"
            >
              {t("consultQueueBadge", { count: context.pendingConsults })}
            </Link>
          ) : null}
          <ThemeToggle variant="pill" />
          <AdminUserMenu email={context.email} />
        </div>
      </div>
    </header>
  );
}
