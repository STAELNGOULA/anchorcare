import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";

export type StepItem = {
  title: string;
  body: string;
};

type StepsSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  steps: StepItem[];
  tone?: MarketingSectionTone;
};

export function StepsSection({
  id = "how-it-works",
  title,
  subtitle,
  steps,
  tone = "default",
}: StepsSectionProps) {
  return (
    <SectionShell id={id} labelledBy="steps-heading" tone={tone}>
      <RevealOnView>
        <SectionHeading id="steps-heading" title={title} subtitle={subtitle} />
      </RevealOnView>

      <ol
        className={`${marketingSectionBody} grid ${marketingGridGap} md:grid-cols-2 lg:grid-cols-4`}
      >
        {steps.map((step, index) => (
          <RevealOnView key={step.title} delayMs={index * 70}>
            <li className="flex h-full flex-col rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-lg text-primary">
                {index + 1}
              </span>
              <h3 className="font-display text-xl text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          </RevealOnView>
        ))}
      </ol>
    </SectionShell>
  );
}
