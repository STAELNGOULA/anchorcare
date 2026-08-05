import { marketingContainer, marketingHero } from "@/lib/marketing-layout";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  subtitle: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  signInCta?: { href: string; prompt: string; label: string };
  className?: string;
};

export function PageHero({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  signInCta,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(marketingHero, marketingContainer, className)}
      aria-labelledby="page-hero-heading"
    >
      <RevealOnView className="mx-auto max-w-3xl space-y-6 text-center md:space-y-7">
        <h1
          id="page-hero-heading"
          className="font-display text-balance text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl"
        >
          {title}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
          {subtitle}
        </p>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
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
          {signInCta ? (
            <p className="text-sm text-muted-foreground">
              {signInCta.prompt}{" "}
              <Link
                href={signInCta.href}
                className="font-medium text-primary hover:underline"
              >
                {signInCta.label}
              </Link>
            </p>
          ) : null}
        </div>
      </RevealOnView>
    </section>
  );
}
