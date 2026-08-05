import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { DashboardAction } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type DashboardActionsProps = {
  actions: DashboardAction[];
};

export async function DashboardActions({ actions }: DashboardActionsProps) {
  const t = await getTranslations("business.dashboard");

  if (actions.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {actions.map((action) => (
        <Link key={action.id} href={action.href} className="group block">
          <BezelCard
            className={cn(
              "h-full p-5 transition-[box-shadow,background-color] duration-300 ease-premium md:p-6",
              "hover:shadow-soft group-hover:bg-secondary/30",
              action.tone === "accent" && "ring-primary/25",
            )}
          >
            <p className="font-display text-lg text-foreground">
              {t(`action.${action.id}.title`)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`action.${action.id}.body`)}
            </p>
            <span className="mt-4 inline-flex text-sm font-medium text-primary group-hover:text-primary/80">
              {t(`action.${action.id}.cta`)} →
            </span>
          </BezelCard>
        </Link>
      ))}
    </div>
  );
}
