"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BookPayStepper } from "@/components/public/book-pay-stepper";
import type { ParentChildOption } from "@/lib/invites/types";
import type { PublicProgramDetail } from "@/lib/public/public-program-service";
import { formatSpotsLabel, resolveSmartCta } from "@/lib/public/smart-cta";

type PublicProgramPageProps = {
  program: PublicProgramDetail;
  accentColor: string;
  user: { id: string; email: string } | null;
  children: ParentChildOption[];
  enrolled?: boolean;
};

export function PublicProgramPageClient({
  program,
  accentColor,
  user,
  children,
  enrolled,
}: PublicProgramPageProps) {
  const t = useTranslations("public");
  const [stepperOpen, setStepperOpen] = useState(false);
  const cta = resolveSmartCta(program);
  const spotsLabel = formatSpotsLabel(program, (key, values) =>
    t(`spots.${key}`, values),
  );
  const returnPath = `/p/${program.orgSlug}/programs/${program.programSlug}`;

  return (
    <div className="min-h-[100dvh] bg-[#F5F0E8] pb-28 text-[#1B2B4B]">
      <div className="mx-auto max-w-3xl px-6 pt-6">
        <Link
          href={`/p/${program.orgSlug}`}
          className="inline-flex items-center gap-1 text-sm text-[#1B2B4B]/70 transition-colors hover:text-[#1B2B4B]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToPrograms", { org: program.orgName })}
        </Link>
      </div>

      {enrolled ? (
        <div className="mx-auto mt-4 max-w-3xl px-6">
          <div className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-900">
            {t("enrollSuccess")}
          </div>
        </div>
      ) : null}

      {program.heroImageUrl ? (
        <div className="relative mx-auto mt-6 aspect-[16/9] max-w-3xl overflow-hidden rounded-2xl px-6">
          <div className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-black/5">
            <Image
              src={program.heroImageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-[#1B2B4B]/60">{program.orgName}</p>
          <h1 className="font-display text-3xl leading-tight md:text-4xl">
            {program.publicHeadline}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold">{program.priceDisplay}</span>
            <span className="text-sm text-[#1B2B4B]/60">
              {t(`billing.${program.billingInterval}`)}
            </span>
          </div>
          {spotsLabel ? (
            <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-900">
              {spotsLabel}
            </span>
          ) : null}
        </header>

        {program.scheduleSummary ? (
          <section>
            <h2 className="font-display text-lg">{t("schedule")}</h2>
            <p className="mt-2 text-sm text-[#1B2B4B]/80">{program.scheduleSummary}</p>
          </section>
        ) : null}

        {program.ageRangeLabel || program.ageMin != null ? (
          <section>
            <h2 className="font-display text-lg">{t("ages")}</h2>
            <p className="mt-2 text-sm text-[#1B2B4B]/80">
              {program.ageRangeLabel ??
                t("ageRange", { min: program.ageMin ?? 0, max: program.ageMax ?? 18 })}
            </p>
          </section>
        ) : null}

        {program.publicDescription ? (
          <section>
            <h2 className="font-display text-lg">{t("description")}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1B2B4B]/80">
              {program.publicDescription}
            </p>
          </section>
        ) : null}

        {program.priceNote ? (
          <p className="text-sm text-[#1B2B4B]/60">{program.priceNote}</p>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(27,43,75,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{program.priceDisplay}</p>
          </div>
          {cta.actionable ? (
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-[#1B2B4B] transition-transform duration-150 ease-out active:scale-[0.98]"
              style={{ backgroundColor: accentColor }}
              onClick={() => setStepperOpen(true)}
            >
              {t(`cta.${cta.labelKey}`)}
            </button>
          ) : (
            <span className="text-sm text-[#1B2B4B]/55">{t(`cta.${cta.labelKey}`)}</span>
          )}
        </div>
      </div>

      <BookPayStepper
        open={stepperOpen}
        onOpenChange={setStepperOpen}
        program={program}
        orgSlug={program.orgSlug}
        orgName={program.orgName}
        accentColor={accentColor}
        user={user}
        children={children}
        returnPath={returnPath}
      />
    </div>
  );
}
