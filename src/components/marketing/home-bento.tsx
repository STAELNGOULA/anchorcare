import { BezelCard } from "@/components/marketing/bezel-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";

type HomeBentoProps = {
  labels: {
    bentoSectionTitle: string;
    bentoTimelineTitle: string;
    bentoTimelineBody: string;
    bentoTimelineStep1: string;
    bentoTimelineStep2: string;
    bentoTimelineStep3: string;
    bentoVoiceTitle: string;
    bentoVoiceBody: string;
    bentoSafetyTitle: string;
    bentoSafetyBody: string;
    bentoProgramsTitle: string;
    bentoProgramsBody: string;
    bentoProgramsHighlight: string;
  };
  tone?: MarketingSectionTone;
};

function WaveLines() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="h-20 w-full text-primary/25"
      aria-hidden
    >
      <path
        d="M0 40C30 20 50 60 80 40s50-20 80 0 40 20 40 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M0 55C35 35 55 70 90 50s45-15 75 5 35 25 35 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
    </svg>
  );
}

export function HomeBento({ labels, tone = "muted" }: HomeBentoProps) {
  const timelineSteps = [
    labels.bentoTimelineStep1,
    labels.bentoTimelineStep2,
    labels.bentoTimelineStep3,
  ];

  return (
    <SectionShell
      id="how-it-works"
      labelledBy="how-it-works-heading"
      tone={tone}
    >
      <RevealOnView>
        <SectionHeading
          id="how-it-works-heading"
          title={labels.bentoSectionTitle}
        />
      </RevealOnView>

      <div
        className={`${marketingSectionBody} grid grid-cols-1 ${marketingGridGap} md:grid-cols-12`}
      >
        <RevealOnView className="md:col-span-7 md:row-span-2">
          <BezelCard className="h-full">
            <div className="flex h-full flex-col justify-between gap-8 p-6 md:p-8">
              <div className="space-y-3">
                <h3 className="font-display text-2xl text-foreground md:text-3xl">
                  {labels.bentoTimelineTitle}
                </h3>
                <p className="max-w-xl text-muted-foreground">
                  {labels.bentoTimelineBody}
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                <ol className={`flex flex-col ${marketingGridGap}`}>
                  {timelineSteps.map((item, index) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </BezelCard>
        </RevealOnView>

        <RevealOnView className="md:col-span-5" delayMs={80}>
          <BezelCard className="h-full">
            <div className="space-y-4 p-6 md:p-7">
              <WaveLines />
              <h3 className="font-display text-xl text-foreground">
                {labels.bentoVoiceTitle}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {labels.bentoVoiceBody}
              </p>
            </div>
          </BezelCard>
        </RevealOnView>

        <RevealOnView className="md:col-span-5" delayMs={140}>
          <section id="safety" className="h-full scroll-mt-28">
            <BezelCard className="h-full">
              <div className="space-y-4 p-6 md:p-7">
                <h3 className="font-display text-xl text-foreground">
                  {labels.bentoSafetyTitle}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {labels.bentoSafetyBody}
                </p>
              </div>
            </BezelCard>
          </section>
        </RevealOnView>

        <RevealOnView className="md:col-span-12" delayMs={180}>
          <section id="for-parents" className="scroll-mt-28">
            <BezelCard>
              <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:items-center md:p-8">
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-foreground">
                    {labels.bentoProgramsTitle}
                  </h3>
                  <p className="max-w-2xl text-muted-foreground">
                    {labels.bentoProgramsBody}
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-secondary/80 p-6 ring-1 ring-border/40">
                  <p className="font-display text-lg leading-snug text-foreground">
                    {labels.bentoProgramsHighlight}
                  </p>
                </div>
              </div>
            </BezelCard>
          </section>
        </RevealOnView>
      </div>
    </SectionShell>
  );
}
