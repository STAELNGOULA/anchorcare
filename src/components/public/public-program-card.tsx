"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookPayStepper } from "@/components/public/book-pay-stepper";
import type { ParentChildOption } from "@/lib/invites/types";
import type { PublicProgramListing } from "@/lib/business/program-types";
import { formatSpotsLabel, resolveSmartCta } from "@/lib/public/smart-cta";

type PublicProgramCardProps = {
  program: PublicProgramListing;
  orgSlug: string;
  orgName: string;
  accentColor: string;
  user: { id: string; email: string } | null;
  children: ParentChildOption[];
  index?: number;
};

export function PublicProgramCard({
  program,
  orgSlug,
  orgName,
  accentColor,
  user,
  children,
  index = 0,
}: PublicProgramCardProps) {
  const t = useTranslations("public");
  const [stepperOpen, setStepperOpen] = useState(false);
  const cta = resolveSmartCta(program);
  const spotsLabel = formatSpotsLabel(program, (key, values) =>
    t(`spots.${key}`, values),
  );
  const detailHref = `/p/${orgSlug}/programs/${program.programSlug}`;
  const returnPath = detailHref;

  const ctaLabel = t(`cta.${cta.labelKey}`);

  return (
    <>
      <li
        className="group flex flex-col overflow-hidden rounded-xl bg-[#F5F0E8]/60 ring-1 ring-black/5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <Link href={detailHref} className="block">
          {program.heroImageUrl ? (
            <div className="relative aspect-[16/9] overflow-hidden bg-[#1B2B4B]/5">
              <Image
                src={program.heroImageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <Link href={detailHref} className="font-display text-lg leading-snug text-[#1B2B4B] hover:underline">
              {program.publicHeadline}
            </Link>
            <span className="shrink-0 text-sm font-semibold text-[#1B2B4B]">
              {program.priceDisplay}
            </span>
          </div>
          {program.ageRangeLabel ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#1B2B4B]/55">
              {program.ageRangeLabel}
            </p>
          ) : null}
          {program.scheduleSummary ? (
            <p className="mt-2 text-sm text-[#1B2B4B]/75">{program.scheduleSummary}</p>
          ) : null}
          {program.publicDescription ? (
            <p className="mt-2 line-clamp-2 text-sm text-[#1B2B4B]/65">
              {program.publicDescription}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
            {spotsLabel ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  program.spotsRemaining === 0
                    ? "bg-amber-500/15 text-amber-900"
                    : "bg-emerald-500/15 text-emerald-900"
                }`}
              >
                {spotsLabel}
              </span>
            ) : null}
            {cta.actionable ? (
              <button
                type="button"
                className="ml-auto inline-flex h-10 min-w-[44px] items-center rounded-full px-4 text-sm font-medium text-[#1B2B4B] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
                style={{ backgroundColor: accentColor }}
                onClick={() => setStepperOpen(true)}
              >
                {ctaLabel}
              </button>
            ) : (
              <span className="ml-auto text-xs text-[#1B2B4B]/55">{ctaLabel}</span>
            )}
          </div>
        </div>
      </li>

      <BookPayStepper
        open={stepperOpen}
        onOpenChange={setStepperOpen}
        program={program}
        orgSlug={orgSlug}
        orgName={orgName}
        accentColor={accentColor}
        user={user}
        children={children}
        returnPath={returnPath}
      />
    </>
  );
}
