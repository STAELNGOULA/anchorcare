"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DIRECTOR_NAV, isDirectorNavActive } from "@/lib/business/navigation";
import {
  directorRailWidth,
  shellNavHeight,
  shellNavStickyTop,
} from "@/lib/business/layout";
import { cn } from "@/lib/utils";

export function DirectorDesktopNav() {
  const pathname = usePathname();
  const t = useTranslations("business.nav");

  return (
    <nav
      className={cn(
        "z-30 hidden self-start lg:block",
        shellNavStickyTop,
        directorRailWidth,
        shellNavHeight,
      )}
      aria-label={t("primary")}
    >
      <div className="flex h-full flex-col rounded-[1.5rem] border border-border/50 bg-card/90 p-2 shadow-soft backdrop-blur-xl">
        <ul className="space-y-1">
          {DIRECTOR_NAV.map((item) => {
            const active = isDirectorNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color] duration-300 ease-premium",
                    active
                      ? "bg-primary/12 text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
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
      </div>
    </nav>
  );
}

export function DirectorMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("business.nav");

  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-40 lg:hidden"
      aria-label={t("primary")}
    >
      <div className="flex items-stretch justify-between gap-0.5 rounded-full border border-border/50 bg-card/95 p-1 shadow-[0_20px_60px_-24px_rgba(15,42,61,0.2)] backdrop-blur-xl">
        {DIRECTOR_NAV.map((item) => {
          const active = isDirectorNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-medium leading-none transition-[background-color,color] duration-300 ease-premium active:scale-[0.98]",
                active
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** @deprecated Use DirectorDesktopNav + DirectorMobileNav */
export function DirectorNav() {
  return (
    <>
      <DirectorDesktopNav />
      <DirectorMobileNav />
    </>
  );
}
