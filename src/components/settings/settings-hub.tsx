import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import type {
  SettingsHubGroup,
  SettingsHubHints,
  SettingsHubSection,
} from "@/lib/settings/settings-hub-types";
import { cn } from "@/lib/utils";

type SettingsHubProps = {
  namespace: string;
  groups: readonly SettingsHubGroup[];
  hints?: SettingsHubHints;
};

type Translator = Awaited<ReturnType<typeof getTranslations>>;

function badgeLabel(t: Translator, badge: SettingsHubSection["badge"]): string {
  if (badge === "p15") return t("badgeP15");
  if (badge === "p2") return t("badgeP2");
  return t("comingSoon");
}

function planLabel(
  t: Translator,
  plan: NonNullable<SettingsHubSection["planBadge"]>,
): string {
  return plan === "family" ? t("planFamily") : t("planFree");
}

function SectionCard({
  section,
  hintKey,
  t,
}: {
  section: SettingsHubSection;
  hintKey?: string;
  t: Translator;
}) {
  const title = t(`sections.${section.key}.title`);
  const body = t(`sections.${section.key}.body`);
  const hintText = hintKey ? t(`hints.${hintKey}`) : null;
  const locked = section.locked ?? false;

  const trailing = (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {section.planBadge ? (
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            section.planBadge === "family"
              ? "bg-primary/12 text-primary"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {planLabel(t, section.planBadge)}
        </span>
      ) : null}
      {section.badge ? (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {badgeLabel(t, section.badge)}
        </span>
      ) : null}
      {section.href && !locked ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      ) : null}
    </div>
  );

  const content = (
    <BezelCard
      className={cn(
        "p-5 transition-[box-shadow,transform,opacity] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] md:p-6",
        section.href && !locked && "hover:shadow-soft hover:-translate-y-px",
        locked && "opacity-70 saturate-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-lg text-foreground">{title}</p>
        {trailing}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {hintText ? (
        <p className="mt-3 text-sm font-medium text-primary">{hintText}</p>
      ) : null}
    </BezelCard>
  );

  if (!section.href) {
    return <div>{content}</div>;
  }

  return (
    <Link
      href={section.href}
      className="block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}

export async function SettingsHub({
  namespace,
  groups,
  hints = {},
}: SettingsHubProps) {
  const t = await getTranslations(namespace);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`hub-${group.key}`}>
          <h2
            id={`hub-${group.key}`}
            className="font-display text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t(`groups.${group.key}`)}
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {group.sections.map((section) => {
              const hintKey = section.hintKey
                ? hints[section.hintKey]
                : hints[section.key];
              return (
                <SectionCard
                  key={section.key}
                  section={section}
                  hintKey={hintKey}
                  t={t}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
