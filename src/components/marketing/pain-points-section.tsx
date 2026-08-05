import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";

export type PainPoint = {
  title: string;
  body: string;
};

type PainPointsSectionProps = {
  title: string;
  subtitle: string;
  points: PainPoint[];
  tone?: MarketingSectionTone;
};

export function PainPointsSection({
  title,
  subtitle,
  points,
  tone = "muted",
}: PainPointsSectionProps) {
  return (
    <SectionShell labelledBy="pain-heading" tone={tone}>
      <RevealOnView>
        <SectionHeading id="pain-heading" title={title} subtitle={subtitle} />
      </RevealOnView>

      <ul
        className={`${marketingSectionBody} grid ${marketingGridGap} md:grid-cols-3`}
      >
        {points.map((point, index) => (
          <RevealOnView key={point.title} delayMs={index * 60} className="h-full">
            <li className="h-full rounded-[1.25rem] border border-border/50 bg-card p-6 shadow-soft">
              <h3 className="font-display text-xl text-foreground">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </li>
          </RevealOnView>
        ))}
      </ul>
    </SectionShell>
  );
}
