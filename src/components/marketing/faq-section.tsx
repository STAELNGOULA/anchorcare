"use client";

import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";
import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  id?: string;
  title: string;
  items: FaqItem[];
  tone?: MarketingSectionTone;
};

export function FaqSection({
  id = "faq",
  title,
  items,
  tone = "muted",
}: FaqSectionProps) {
  return (
    <SectionShell id={id} labelledBy="faq-heading" tone={tone}>
      <RevealOnView>
        <SectionHeading id="faq-heading" title={title} />
      </RevealOnView>
      <div className={`${marketingSectionBody} flex flex-col ${marketingGridGap}`}>
        {items.map((item, index) => (
          <RevealOnView key={item.question} delayMs={index * 60}>
            <details className="group rounded-[1.25rem] bg-card ring-1 ring-border/50 open:shadow-soft">
              <summary
                className={cn(
                  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium text-foreground",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <span>{item.question}</span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-transform duration-300 ease-premium group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="border-t border-border/40 px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          </RevealOnView>
        ))}
      </div>
    </SectionShell>
  );
}
