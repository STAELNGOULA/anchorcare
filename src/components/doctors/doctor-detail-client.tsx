"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { DoctorRecord } from "@/lib/doctors/doctor-types";
import { cn } from "@/lib/utils";

type DoctorDetailClientProps = {
  doctorId: string;
};

export function DoctorDetailClient({ doctorId }: DoctorDetailClientProps) {
  const t = useTranslations("parent.care.doctors.detail");
  const tDoctor = useTranslations("parent.care.doctors");
  const searchParams = useSearchParams();
  const incidentId = searchParams.get("incidentId");
  const childId = searchParams.get("childId");

  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [booking, setBooking] = useState(false);

  const backHref = (() => {
    const params = new URLSearchParams();
    if (incidentId) params.set("incidentId", incidentId);
    if (childId) params.set("childId", childId);
    const qs = params.toString();
    return `/parent/care/doctors${qs ? `?${qs}` : ""}`;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/parent/doctors/${doctorId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setDoctor(data.doctor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBook = async () => {
    if (!doctor) return;
    setBooking(true);
    try {
      const res = await fetch(`/api/parent/doctors/${doctorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          incidentId: incidentId ?? undefined,
          childId: childId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.bookingUrl) {
        toast.error(t("bookingError"));
        return;
      }
      window.open(data.bookingUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(t("bookingError"));
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <SkeletonList count={1} />;
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4">
        <ErrorState title={t("errorTitle")} onRetry={() => void load()} />
        <Link
          href={backHref}
          className="inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          {t("back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors duration-[220ms] ease-out hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="size-28 shrink-0 overflow-hidden rounded-[1.25rem] bg-secondary">
          {doctor.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctor.photoUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-display text-3xl text-muted-foreground">
              {doctor.displayName.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {doctor.displayName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {tDoctor(`specialty.${doctor.specialty}`)} · {doctor.country}
              {doctor.region ? ` · ${doctor.region}` : ""}
            </p>
          </div>

          {doctor.languages.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {doctor.languages
                .map((code) => tDoctor(`language.${code}` as "language.en"))
                .join(" · ")}
            </p>
          ) : null}

          {doctor.bio ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {doctor.bio}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
        <button
          type="button"
          disabled={booking}
          onClick={() => void handleBook()}
          className={cn(
            "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
            "transition-[transform,background-color] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            "hover:bg-primary/92 active:scale-[0.98] disabled:opacity-60",
          )}
        >
          {booking ? t("bookingPending") : t("bookCta")}
          <ExternalLink className="size-4" aria-hidden />
        </button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t("bookingNote")}
        </p>
        {incidentId && childId ? (
          <p className="text-center text-xs text-primary/80">
            {t("incidentPrefillNote")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
