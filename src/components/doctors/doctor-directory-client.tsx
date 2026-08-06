"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import { DOCTOR_SPECIALTY_VALUES } from "@/lib/doctors/doctor-specialties";
import type {
  DoctorListItem,
  IncidentBookingPrefill,
} from "@/lib/doctors/doctor-types";
import { cn } from "@/lib/utils";

export function DoctorDirectoryClient() {
  const t = useTranslations("parent.care.doctors");
  const router = useRouter();
  const searchParams = useSearchParams();

  const incidentId = searchParams.get("incidentId");
  const childId = searchParams.get("childId");

  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [incidentPrefill, setIncidentPrefill] =
    useState<IncidentBookingPrefill | null>(null);
  const [regionEmpty, setRegionEmpty] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (search.trim()) params.set("q", search.trim());
    if (incidentId) params.set("incidentId", incidentId);
    if (childId) params.set("childId", childId);
    return params.toString();
  }, [specialty, search, incidentId, childId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/parent/doctors?${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setDoctors(data.doctors ?? []);
      setRegionEmpty(Boolean(data.regionEmpty));
      setIncidentPrefill(data.incidentPrefill ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const detailHref = (doctorId: string) => {
    const params = new URLSearchParams();
    if (incidentId) params.set("incidentId", incidentId);
    if (childId) params.set("childId", childId);
    const qs = params.toString();
    return `/parent/care/doctors/${doctorId}${qs ? `?${qs}` : ""}`;
  };

  if (loading && doctors.length === 0) {
    return <SkeletonList count={4} />;
  }

  if (error) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      {incidentPrefill ? (
        <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm font-medium text-foreground">{t("incidentBanner.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("incidentBanner.body", {
              child: incidentPrefill.childName,
              type: incidentPrefill.incidentType.replace(/_/g, " "),
            })}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={cn(
              "h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          aria-label={t("filterSpecialty")}
        >
          <option value="">{t("allSpecialties")}</option>
          {DOCTOR_SPECIALTY_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`specialty.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {regionEmpty ? (
        <EmptyState
          title={t("regionEmptyTitle")}
          description={t("regionEmptyBody")}
          actionLabel={t("regionEmptyCta")}
          actionHref="mailto:support@anchorcare.app"
        />
      ) : doctors.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              href={detailHref(doctor.id)}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        <button
          type="button"
          className="underline-offset-4 hover:underline"
          onClick={() => router.push("/parent/care/visits")}
        >
          {t("visitHistoryLink")}
        </button>
      </p>
    </div>
  );
}
