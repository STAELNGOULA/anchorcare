"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DoctorListItem } from "@/lib/doctors/doctor-types";
import { cn } from "@/lib/utils";

type DoctorCardProps = {
  doctor: DoctorListItem;
  href: string;
};

const COUNTRY_LABELS: Record<string, string> = {
  US: "US",
  CA: "CA",
};

export function DoctorCard({ doctor, href }: DoctorCardProps) {
  const t = useTranslations("parent.care.doctors");

  return (
    <Link
      href={href}
      className={cn(
        "group flex gap-4 rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
        "transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99]",
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
        {doctor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doctor.photoUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-xl text-muted-foreground">
            {doctor.displayName.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight text-foreground">
              {doctor.displayName}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(`specialty.${doctor.specialty}`)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {doctor.isFeatured ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {t("featured")}
              </span>
            ) : null}
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {COUNTRY_LABELS[doctor.country] ?? doctor.country}
            </span>
          </div>
        </div>

        {doctor.bio ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {doctor.bio}
          </p>
        ) : null}

        {doctor.languages.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {doctor.languages
              .map((code) => t(`language.${code}` as "language.en"))
              .join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
