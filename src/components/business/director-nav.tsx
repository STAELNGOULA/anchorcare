"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DIRECTOR_NAV, isDirectorNavActive } from "@/lib/business/navigation";
import { cn } from "@/lib/utils";

export function DirectorSidebarNav() {
  const pathname = usePathname();
  const t = useTranslations("business.nav");

  return (
    <ul className="space-y-0.5">
      {DIRECTOR_NAV.map((item) => {
        const active = isDirectorNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color] duration-300 ease-premium",
                active
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DirectorMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("business.nav");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90 lg:hidden"
      aria-label={t("primary")}
    >
      <div className="flex items-stretch justify-between px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
        {DIRECTOR_NAV.map((item) => {
          const active = isDirectorNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium leading-none transition-[color] duration-300 ease-premium active:scale-[0.98]",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
