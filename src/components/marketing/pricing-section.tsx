import { SectionHeading } from "@/components/marketing/section-heading";
import { SectionShell } from "@/components/marketing/section-shell";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import {
  marketingGridGap,
  marketingSectionBody,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";
import { cn } from "@/lib/utils";

export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  annualNote?: string;
  description: string;
  features: string[];
  cta: { href: string; label: string };
  highlighted?: boolean;
};

type PricingSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  plans: PricingPlan[];
  footnote?: string;
  tone?: MarketingSectionTone;
};

export function PricingSection({
  id = "pricing",
  title,
  subtitle,
  plans,
  footnote,
  tone = "default",
}: PricingSectionProps) {
  return (
    <SectionShell id={id} labelledBy="pricing-heading" tone={tone}>
      <RevealOnView>
        <SectionHeading
          id="pricing-heading"
          title={title}
          subtitle={subtitle}
          className={plans.length === 1 ? "mx-auto text-center" : undefined}
        />
      </RevealOnView>

      <div
        className={cn(
          marketingSectionBody,
          "grid",
          marketingGridGap,
          plans.length === 1 ? "mx-auto max-w-xl" : "lg:grid-cols-2",
        )}
      >
        {plans.map((plan, index) => (
          <RevealOnView key={plan.name} delayMs={index * 80}>
            <article
              className={cn(
                "flex h-full flex-col rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8",
                plan.highlighted &&
                  "ring-primary/35 shadow-elevated",
              )}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-2xl text-foreground md:text-3xl">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  {plan.annualNote ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.annualNote}
                    </p>
                  ) : null}
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 border-t border-border/40 pt-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-sm leading-relaxed text-foreground"
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        aria-hidden
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3 w-3"
                          fill="none"
                        >
                          <path
                            d="M3.5 8.5 6.5 11.5 12.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <PremiumCta href={plan.cta.href}>{plan.cta.label}</PremiumCta>
              </div>
            </article>
          </RevealOnView>
        ))}
      </div>

      {footnote ? (
        <RevealOnView>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {footnote}
          </p>
        </RevealOnView>
      ) : null}
    </SectionShell>
  );
}
