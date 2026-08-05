import { BezelCard } from "@/components/marketing/bezel-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import Link from "next/link";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";

type AudienceCard = {
  title: string;
  body: string;
  learnMoreHref: string;
  learnMoreLabel: string;
};

type AudienceSplitProps = {
  title: string;
  subtitle: string;
  parents: AudienceCard;
  programs: AudienceCard;
  tone?: MarketingSectionTone;
};

export function AudienceSplit({
  title,
  subtitle,
  parents,
  programs,
  tone = "muted",
}: AudienceSplitProps) {
  return (
    <SectionShell id="audiences" labelledBy="audiences-heading" tone={tone}>
      <RevealOnView>
        <SectionHeading
          id="audiences-heading"
          title={title}
          subtitle={subtitle}
        />
      </RevealOnView>

      <div className={`${marketingSectionBody} grid ${marketingGridGap} md:grid-cols-2`}>
        {[parents, programs].map((card, index) => (
          <RevealOnView key={card.title} delayMs={index * 80}>
            <BezelCard className="h-full">
              <div className="flex h-full flex-col justify-between gap-8 p-6 md:p-8">
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-foreground md:text-3xl">
                    {card.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                </div>
                <Link
                  href={card.learnMoreHref}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-primary transition-colors duration-300 ease-premium hover:text-primary/80"
                >
                  {card.learnMoreLabel} →
                </Link>
              </div>
            </BezelCard>
          </RevealOnView>
        ))}
      </div>
    </SectionShell>
  );
}
