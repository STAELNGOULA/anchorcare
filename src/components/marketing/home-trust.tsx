import { SectionShell } from "@/components/marketing/section-shell";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import type { MarketingSectionTone } from "@/lib/marketing-layout";

type HomeTrustProps = {
  labels: {
    trustQuote: string;
    trustAttribution: string;
  };
  tone?: MarketingSectionTone;
};

export function HomeTrust({ labels, tone = "default" }: HomeTrustProps) {
  return (
    <SectionShell aria-labelledby="trust-heading" tone={tone}>
      <RevealOnView>
        <figure className="relative overflow-hidden rounded-[2rem] bg-anchor-navy px-6 py-12 text-anchor-sand md:px-12 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 0.5px, transparent 0.6px)",
              backgroundSize: "4px 4px",
            }}
            aria-hidden
          />
          <blockquote className="relative max-w-3xl">
            <p
              id="trust-heading"
              className="font-display text-2xl leading-snug md:text-4xl"
            >
              {labels.trustQuote}
            </p>
            <figcaption className="mt-6 text-sm text-anchor-sand/75">
              {labels.trustAttribution}
            </figcaption>
          </blockquote>
        </figure>
      </RevealOnView>
    </SectionShell>
  );
}
