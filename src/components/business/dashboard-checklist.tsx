import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { DashboardChecklistItem } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type DashboardChecklistProps = {
  items: DashboardChecklistItem[];
  complete: boolean;
};

export async function DashboardChecklist({
  items,
  complete,
}: DashboardChecklistProps) {
  const t = await getTranslations("business.dashboard");

  if (complete) return null;

  return (
    <BezelCard className="p-6 md:p-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl text-foreground md:text-2xl">
          {t("checklistTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("checklistSubtitle")}</p>
      </div>
      <ol className="mt-6 space-y-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 transition-[background-color] duration-300 ease-premium hover:bg-secondary/60",
                item.done && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ring-1",
                  item.done
                    ? "bg-primary/15 text-primary ring-primary/30"
                    : "bg-secondary text-muted-foreground ring-border/60",
                )}
                aria-hidden
              >
                {item.done ? "✓" : index + 1}
              </span>
              <span className="text-sm text-foreground">
                {t(`checklist.${item.id}`)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </BezelCard>
  );
}
