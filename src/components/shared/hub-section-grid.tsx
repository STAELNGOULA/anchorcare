import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import { cn } from "@/lib/utils";

type HubSection = {
  key: string;
  href?: string;
  badge?: "comingSoon" | "p15" | "p2";
};

type HubSectionGridProps = {
  namespace: string;
  sections: readonly HubSection[];
  columns?: "1" | "2";
};

export async function HubSectionGrid({
  namespace,
  sections,
  columns = "2",
}: HubSectionGridProps) {
  const t = await getTranslations(namespace);

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === "2" ? "md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {sections.map((section) => {
        const title = t(`sections.${section.key}.title`);
        const body = t(`sections.${section.key}.body`);
        const badgeKey = section.badge ?? "comingSoon";
        const badgeLabel =
          badgeKey === "p15"
            ? t("badgeP15")
            : badgeKey === "p2"
              ? t("badgeP2")
              : t("comingSoon");

        const inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-lg text-foreground">{title}</p>
              {section.href ? (
                <span className="shrink-0 text-xs font-medium text-primary">
                  {t("manage")}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {badgeLabel}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </>
        );

        if (section.href) {
          return (
            <Link key={section.key} href={section.href} className="block">
              <BezelCard className="p-5 transition-[box-shadow,transform] duration-300 ease-premium hover:shadow-soft md:p-6">
                {inner}
              </BezelCard>
            </Link>
          );
        }

        return (
          <BezelCard key={section.key} className="p-5 md:p-6">
            {inner}
          </BezelCard>
        );
      })}
    </div>
  );
}
