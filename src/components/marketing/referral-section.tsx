import { SectionShell } from "@/components/marketing/section-shell";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { RevealOnView } from "@/components/marketing/reveal-on-view";
import type { MarketingSectionTone } from "@/lib/marketing-layout";

type ReferralSectionProps = {
  title: string;
  body: string;
  cta: { href: string; label: string };
  note?: string;
  tone?: MarketingSectionTone;
};

export function ReferralSection({
  title,
  body,
  cta,
  note,
  tone = "default",
}: ReferralSectionProps) {
  return (
    <SectionShell id="referrals" labelledBy="referral-heading" tone={tone}>
      <RevealOnView>
        <div className="rounded-[2rem] bg-anchor-navy px-6 py-12 text-anchor-sand md:px-10 md:py-14">
          <h2
            id="referral-heading"
            className="max-w-xl font-display text-2xl leading-tight md:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-anchor-sand/85">
            {body}
          </p>
          {note ? (
            <p className="mt-4 text-sm text-anchor-sand/65">{note}</p>
          ) : null}
          <div className="mt-8">
            <PremiumCta
              href={cta.href}
              variant="secondary"
              className="!bg-anchor-sand !text-anchor-navy hover:!bg-anchor-sand/90"
            >
              {cta.label}
            </PremiumCta>
          </div>
        </div>
      </RevealOnView>
    </SectionShell>
  );
}
