import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";

export type RetentionItem = {
  title: string;
  body: string;
};

type RetentionSectionProps = {
  title: string;
  subtitle: string;
  items: RetentionItem[];
  cta?: { href: string; label: string };
  tone?: MarketingSectionTone;
};

export function RetentionSection({
  title,
  subtitle,
  items,
  cta,
  tone = "default",
}: RetentionSectionProps) {
  return (
    <SectionShell labelledBy="retention-heading" tone={tone}>
      <div className={`grid ${marketingGridGap} lg:grid-cols-[1fr_1.15fr] lg:items-start`}>
        <RevealOnView>
          <SectionHeading
            id="retention-heading"
            title={title}
            subtitle={subtitle}
          />
          {cta ? (
            <div className="mt-8">
              <PremiumCta href={cta.href}>{cta.label}</PremiumCta>
            </div>
          ) : null}
        </RevealOnView>

        <ul className={`flex flex-col ${marketingGridGap}`}>
          {items.map((item, index) => (
            <RevealOnView key={item.title} delayMs={index * 70}>
              <li className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
                <h3 className="font-display text-lg text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            </RevealOnView>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
