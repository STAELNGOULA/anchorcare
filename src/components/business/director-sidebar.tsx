import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { DirectorSidebarNav } from "@/components/business/director-nav";
import { directorSidebar } from "@/lib/business/layout";
import type { DirectorContext } from "@/lib/business/director-context";

type DirectorSidebarProps = {
  context: Pick<DirectorContext, "orgName">;
};

export async function DirectorSidebar({ context }: DirectorSidebarProps) {
  const t = await getTranslations("business");

  return (
    <aside className={directorSidebar}>
      <div className="flex h-14 shrink-0 items-center border-b border-border/60 px-4">
        <Link
          href="/business/dashboard"
          className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AnchorLogo className="gap-2" />
        </Link>
      </div>

      <div className="min-w-0 border-b border-border/40 px-4 py-3">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("sidebarOrgLabel")}
        </p>
        <p className="truncate font-display text-base text-foreground">
          {context.orgName}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label={t("nav.primary")}>
        <DirectorSidebarNav />
      </nav>

      <div className="shrink-0 border-t border-border/60 p-3">
        <Link
          href="/coach/programs"
          className="flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground ring-1 ring-border/60 transition-colors duration-300 ease-premium hover:bg-secondary/80 hover:text-foreground"
        >
          {t("coachMode")}
        </Link>
      </div>
    </aside>
  );
}
