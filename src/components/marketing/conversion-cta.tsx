import { SectionShell } from "@/components/marketing/section-shell";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import type { MarketingSectionTone } from "@/lib/marketing-layout";
import Link from "next/link";

type ConversionCtaProps = {
  title: string;
  subtitle: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  tone?: MarketingSectionTone;
  inset?: boolean;
};

export function ConversionCta({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  tone = "soft",
  inset = true,
}: ConversionCtaProps) {
  return (
    <SectionShell tone={tone}>
      <RevealOnView>
        <div
          className={
            inset
              ? "rounded-[2rem] border border-border/55 bg-card px-6 py-12 text-center shadow-soft md:px-12 md:py-16"
              : "text-center"
          }
        >
          <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PremiumCta href={primaryCta.href}>{primaryCta.label}</PremiumCta>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-muted-foreground ring-1 ring-border/70 transition-colors duration-300 ease-premium hover:text-foreground"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </RevealOnView>
    </SectionShell>
  );
}
