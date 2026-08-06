import Image from "next/image";
import { MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { OrgProfile } from "@/lib/business/org-profile-types";
import type { PublicProgramListing } from "@/lib/business/program-types";
import type { ParentChildOption } from "@/lib/invites/types";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { PublicProgramCard } from "@/components/public/public-program-card";
import { StickyBookBar } from "@/components/public/sticky-book-bar";

type PublicOrgPageProps = {
  org: OrgProfile;
  programs?: PublicProgramListing[];
  preview?: boolean;
  paymentsWarning?: boolean;
  user?: { id: string; email: string } | null;
  children?: ParentChildOption[];
};

export async function PublicOrgPage({
  org,
  programs = [],
  preview,
  paymentsWarning,
  user = null,
  children = [],
}: PublicOrgPageProps) {
  const t = await getTranslations("public");
  const accent = org.brandAccentColor || "#4ECDC4";
  const address = [org.addressLine1, org.city, org.region, org.postalCode]
    .filter(Boolean)
    .join(", ");
  const hoursRows = (Object.keys({
    mon: 1,
    tue: 1,
    wed: 1,
    thu: 1,
    fri: 1,
    sat: 1,
    sun: 1,
  }) as (keyof typeof org.hoursJson)[]).map((day) => {
    const entry = org.hoursJson[day];
    const dayLabel = t(`days.${day}`);
    if (entry.closed) return { day: dayLabel, hours: t("closed") };
    if (!entry.open || !entry.close) return { day: dayLabel, hours: t("byAppointment") };
    return { day: dayLabel, hours: `${entry.open} – ${entry.close}` };
  });

  return (
    <div className="min-h-[100dvh] bg-[#F5F0E8] pb-24 text-[#1B2B4B]">
      {preview ? (
        <div className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-xs font-medium text-amber-900">
          {t("previewBanner")}
        </div>
      ) : null}

      {paymentsWarning ? (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-900">
          {t("paymentsPreviewWarning")}
        </div>
      ) : null}

      <header
        className="relative overflow-hidden motion-safe:animate-none"
        style={{
          background: org.coverImageUrl
            ? `linear-gradient(to bottom, rgba(27,43,75,0.35), rgba(27,43,75,0.75)), url(${org.coverImageUrl}) center/cover`
            : `linear-gradient(135deg, #1B2B4B 0%, #2a3f66 100%)`,
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center text-white md:py-20">
          {org.logoUrl ? (
            <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-white/40">
              <Image
                src={org.logoUrl}
                alt=""
                width={88}
                height={88}
                className="h-[88px] w-[88px] rounded-xl object-cover"
                sizes="88px"
                priority
              />
            </div>
          ) : null}
          <h1 className="font-display text-3xl leading-tight tracking-tight md:text-5xl">
            {org.publicHeadline}
          </h1>
          {org.publicTagline ? (
            <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">
              {org.publicTagline}
            </p>
          ) : null}
          {org.verifiedBadge ? (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {t("verified")}
            </p>
          ) : null}
          <a
            href="#programs"
            className="mt-8 inline-flex h-11 min-w-[44px] items-center rounded-full px-6 text-sm font-medium text-[#1B2B4B] transition-transform duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none"
            style={{ backgroundColor: accent }}
          >
            {t("viewPrograms")}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-12 px-6 py-12">
        <section id="programs" className="scroll-mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display text-2xl text-[#1B2B4B]">{t("programs")}</h2>
          {programs.length === 0 ? (
            <p className="mt-2 text-sm text-[#1B2B4B]/70">{t("programsEmpty")}</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 motion-safe:animate-in motion-safe:fade-in">
              {programs.map((program, index) => (
                <PublicProgramCard
                  key={program.id}
                  program={program}
                  orgSlug={org.publicSlug}
                  orgName={org.name}
                  accentColor={accent}
                  user={user}
                  children={children}
                  index={index}
                />
              ))}
            </ul>
          )}
        </section>

        {org.publicDescription ? (
          <section className="max-w-none">
            <h2 className="font-display text-2xl text-[#1B2B4B]">{t("about")}</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-[#1B2B4B]/80">
              {org.publicDescription}
            </p>
          </section>
        ) : null}

        {org.galleryImages.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl text-[#1B2B4B]">{t("gallery")}</h2>
            <GalleryLightbox images={org.galleryImages} />
          </section>
        ) : null}

        {(org.verifiedBadge || org.accreditations.length > 0) ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="font-display text-2xl text-[#1B2B4B]">{t("trust")}</h2>
            <ul className="mt-4 space-y-2 text-sm text-[#1B2B4B]/80">
              {org.verifiedBadge ? <li>{t("verifiedOnAnchor")}</li> : null}
              {org.accreditations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="visit" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display text-2xl text-[#1B2B4B]">{t("visit")}</h2>
          {address ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-[#1B2B4B]/80">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{address}</span>
            </p>
          ) : null}
          <ul className="mt-4 space-y-2 text-sm text-[#1B2B4B]/75">
            {hoursRows.map((row) => (
              <li key={row.day} className="flex justify-between gap-4">
                <span className="font-medium">{row.day}</span>
                <span>{row.hours}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="font-medium text-[#1B2B4B]">{t("contact")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#1B2B4B]/80">
              {org.publicPhone ? (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" aria-hidden />
                  <a href={`tel:${org.publicPhone}`} className="hover:underline">
                    {org.publicPhone}
                  </a>
                </li>
              ) : null}
              {org.publicEmail ? (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" aria-hidden />
                  <a href={`mailto:${org.publicEmail}`} className="hover:underline">
                    {org.publicEmail}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </section>
      </main>

      <StickyBookBar
        programs={programs}
        orgSlug={org.publicSlug}
        orgName={org.name}
        accentColor={accent}
        user={user}
        children={children}
      />
    </div>
  );
}
