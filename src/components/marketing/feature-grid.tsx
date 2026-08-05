import { BezelCard } from "@/components/marketing/bezel-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";

export type FeatureItem = {
  title: string;
  body: string;
};

type FeatureGridProps = {
  id?: string;
  title: string;
  subtitle?: string;
  features: FeatureItem[];
  tone?: MarketingSectionTone;
};

export function FeatureGrid({
  id,
  title,
  subtitle,
  features,
  tone = "muted",
}: FeatureGridProps) {
  return (
    <SectionShell id={id} labelledBy="features-heading" tone={tone}>
      <RevealOnView>
        <SectionHeading
          id="features-heading"
          title={title}
          subtitle={subtitle}
        />
      </RevealOnView>

      <div
        className={`${marketingSectionBody} grid ${marketingGridGap} sm:grid-cols-2 lg:grid-cols-3`}
      >
        {features.map((feature, index) => (
          <RevealOnView key={feature.title} delayMs={index * 50}>
            <BezelCard className="h-full">
              <div className="space-y-3 p-6">
                <h3 className="font-display text-xl text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            </BezelCard>
          </RevealOnView>
        ))}
      </div>
    </SectionShell>
  );
}
