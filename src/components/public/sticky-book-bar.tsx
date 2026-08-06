"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookPayStepper } from "@/components/public/book-pay-stepper";
import type { ParentChildOption } from "@/lib/invites/types";
import type { PublicProgramListing } from "@/lib/business/program-types";
import { resolveSmartCta } from "@/lib/public/smart-cta";

type StickyBookBarProps = {
  programs: PublicProgramListing[];
  orgSlug: string;
  orgName: string;
  accentColor: string;
  user: { id: string; email: string } | null;
  children: ParentChildOption[];
};

export function StickyBookBar({
  programs,
  orgSlug,
  orgName,
  accentColor,
  user,
  children,
}: StickyBookBarProps) {
  const t = useTranslations("public");
  const [visible, setVisible] = useState(false);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<PublicProgramListing | null>(null);

  const bookable = programs.find((p) => resolveSmartCta(p).actionable);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!bookable) return null;

  const cta = resolveSmartCta(bookable);

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(27,43,75,0.08)] backdrop-blur-md transition-transform duration-[220ms] ease-out motion-reduce:transition-none ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#1B2B4B]">
              {bookable.publicHeadline}
            </p>
            <p className="text-xs text-[#1B2B4B]/65">{bookable.priceDisplay}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 shrink-0 items-center rounded-full px-5 text-sm font-medium text-[#1B2B4B] transition-transform duration-150 ease-out active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
            onClick={() => {
              setSelectedProgram(bookable);
              setStepperOpen(true);
            }}
          >
            {t(`cta.${cta.labelKey}`)}
          </button>
        </div>
      </div>

      {selectedProgram ? (
        <BookPayStepper
          open={stepperOpen}
          onOpenChange={setStepperOpen}
          program={selectedProgram}
          orgSlug={orgSlug}
          orgName={orgName}
          accentColor={accentColor}
          user={user}
          children={children}
          returnPath={`/p/${orgSlug}/programs/${selectedProgram.programSlug}`}
        />
      ) : null}
    </>
  );
}
