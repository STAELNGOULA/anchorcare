"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type HubTab = {
  key: string;
  href: string;
  exact?: boolean;
};

type HubSubnavProps = {
  tabs: readonly HubTab[];
  ariaLabel: string;
  getLabel: (key: string) => string;
};

export function HubSubnav({ tabs, ariaLabel, getLabel }: HubSubnavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-300 ease-premium",
              active
                ? "bg-primary/12 text-foreground"
                : "text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {getLabel(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
