import { PremiumCta } from "@/components/marketing/premium-cta";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import Link from "next/link";

type HomeCtaBandProps = {
  labels: {
    ctaBandTitle: string;
    ctaBandSubtitle: string;
    ctaBusiness: string;
    ctaParent: string;
  };
};

export function HomeCtaBand({ labels }: HomeCtaBandProps) {
  return (
    <section className="pb-24 md:pb-32" aria-labelledby="cta-band-heading">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <RevealOnView>
          <div className="rounded-[2rem] border border-border/60 bg-secondary/40 px-6 py-12 text-center md:px-12 md:py-16">
            <h2
              id="cta-band-heading"
              className="mx-auto max-w-2xl font-display text-3xl leading-tight text-foreground md:text-4xl"
            >
              {labels.ctaBandTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {labels.ctaBandSubtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PremiumCta href="/sign-up">{labels.ctaBusiness}</PremiumCta>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-muted-foreground ring-1 ring-border/70 transition-colors duration-300 ease-premium hover:text-foreground"
              >
                {labels.ctaParent}
              </Link>
            </div>
          </div>
        </RevealOnView>
      </div>
    </section>
  );
}
