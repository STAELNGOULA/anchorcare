"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/business/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { DoctorRecord } from "@/lib/doctors/doctor-types";
import { cn } from "@/lib/utils";

export function AdminDoctorsWorkspace() {
  const t = useTranslations("admin.doctors");
  const tSpecialty = useTranslations("admin.doctors.specialty");
  const router = useRouter();

  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (includeInactive) params.set("includeInactive", "1");
      const res = await fetch(`/api/admin/doctors?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setDoctors(data.doctors ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, includeInactive]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const toggleActive = async (doctor: DoctorRecord) => {
    setTogglingId(doctor.id);
    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !doctor.isActive }),
      });
      if (!res.ok) throw new Error("toggle_failed");
      toast.success(
        doctor.isActive ? t("toast.deactivated") : t("toast.reactivated"),
      );
      await load();
    } catch {
      toast.error(t("toast.error"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")}>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/visits/upload"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground",
              "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-secondary active:scale-[0.98]",
            )}
          >
            {t("uploadVisit")}
          </Link>
          <Link
            href="/admin/doctors/new"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground",
              "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-primary/92 active:scale-[0.98]",
            )}
          >
            <Plus className="size-4" aria-hidden />
            {t("addDoctor")}
          </Link>
        </div>
      </PageHeader>

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
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="size-4 rounded border-input"
          />
          {t("showInactive")}
        </label>
      </div>

      {loading && doctors.length === 0 ? (
        <SkeletonList count={5} />
      ) : error ? (
        <ErrorState title={t("errorTitle")} onRetry={() => void load()} />
      ) : doctors.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyBody")}
          actionLabel={t("addDoctor")}
          actionHref="/admin/doctors/new"
        />
      ) : (
        <div className="overflow-x-auto rounded-[1.25rem] ring-1 ring-border/50">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border/50 bg-secondary/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("table.name")}</th>
                <th className="px-4 py-3 font-medium">{t("table.specialty")}</th>
                <th className="px-4 py-3 font-medium">{t("table.country")}</th>
                <th className="px-4 py-3 font-medium">{t("table.featured")}</th>
                <th className="px-4 py-3 font-medium">{t("table.active")}</th>
                <th className="px-4 py-3 font-medium">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 bg-card">
              {doctors.map((doctor) => (
                <tr
                  key={doctor.id}
                  className={cn(!doctor.isActive && "opacity-60")}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {doctor.displayName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tSpecialty(doctor.specialty)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doctor.country}
                    {doctor.region ? ` · ${doctor.region}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {doctor.isFeatured ? t("yes") : t("no")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={togglingId === doctor.id}
                      onClick={() => void toggleActive(doctor)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-[220ms] ease-out",
                        doctor.isActive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {doctor.isActive ? t("status.active") : t("status.inactive")}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
