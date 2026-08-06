"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DoctorListItem } from "@/lib/doctors/doctor-types";
import { cn } from "@/lib/utils";

type DoctorPreviewCardProps = {
  doctor: Pick<
    DoctorListItem,
    "displayName" | "photoUrl" | "specialty" | "country" | "bio" | "languages"
  >;
  className?: string;
};

export function DoctorPreviewCard({ doctor, className }: DoctorPreviewCardProps) {
  const t = useTranslations("parent.care.doctors");

  return (
    <div
      className={cn(
        "flex gap-4 rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
        className,
      )}
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
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
      <div className="min-w-0 space-y-1">
        <p className="font-display text-lg text-foreground">{doctor.displayName}</p>
        <p className="text-sm text-muted-foreground">
          {t(`specialty.${doctor.specialty}`)} · {doctor.country}
        </p>
        {doctor.bio ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{doctor.bio}</p>
        ) : null}
      </div>
    </div>
  );
}
