"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/business/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextField } from "@/components/forms/text-field";
import type { AdminChildSearchResult } from "@/lib/visits/visit-types";
import type { DoctorRecord } from "@/lib/doctors/doctor-types";
import { cn } from "@/lib/utils";

export function AdminVisitUploadWorkspace() {
  const t = useTranslations("admin.visits");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminChildSearchResult[]>([]);
  const [selected, setSelected] = useState<AdminChildSearchResult | null>(null);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [summary, setSummary] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId),
    [doctors, doctorId],
  );

  useEffect(() => {
    if (selectedDoctor) {
      setDoctorName(selectedDoctor.displayName);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    void fetch("/api/admin/doctors?includeInactive=0", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      void fetch(
        `/api/admin/visits/children-search?q=${encodeURIComponent(search.trim())}`,
        { credentials: "include" },
      )
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => setResults([]));
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const uploadPdf = async (childId: string): Promise<string | null> => {
    if (!pdfFile) return null;
    const body = new FormData();
    body.append("file", pdfFile);
    body.append("childId", childId);
    const res = await fetch("/api/admin/visits/upload", {
      method: "POST",
      credentials: "include",
      body,
    });
    const data = await res.json();
    if (!res.ok || !data.path) throw new Error("upload_failed");
    return data.path as string;
  };

  const submit = useCallback(
    async (forceDuplicate = false) => {
      if (!selected) {
        toast.error(t("errors.selectChild"));
        return;
      }
      if (!doctorName.trim() || !appointmentDate || !summary.trim()) {
        toast.error(t("errors.required"));
        return;
      }

      setPending(true);
      try {
        const pdfStoragePath = await uploadPdf(selected.childId);
        const res = await fetch("/api/admin/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            childId: selected.childId,
            doctorId: doctorId || null,
            doctorName: doctorName.trim(),
            appointmentDate,
            summary: summary.trim(),
            pdfStoragePath,
            forceDuplicate,
          }),
        });
        const data = await res.json();

        if (res.status === 409 && data.error === "duplicate_date") {
          setDuplicateOpen(true);
          return;
        }

        if (!res.ok) {
          toast.error(t(`errors.${data.error as string}`) || t("errors.saveFailed"));
          return;
        }

        toast.success(t("toast.uploaded"));
        router.push("/admin/doctors");
        router.refresh();
      } catch {
        toast.error(t("errors.saveFailed"));
      } finally {
        setPending(false);
        setDuplicateOpen(false);
        setConfirmOpen(false);
      }
    },
    [
      selected,
      doctorId,
      doctorName,
      appointmentDate,
      summary,
      pdfFile,
      t,
      router,
    ],
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
          <div className="space-y-2">
            <label htmlFor="childSearch" className="text-sm font-medium">
              {t("childSearch")}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="childSearch"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("childSearchPlaceholder")}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm"
              />
            </div>
            {results.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/40">
                {results.map((row) => (
                  <li key={row.childId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(row);
                        setSearch(row.childName);
                        setResults([]);
                      }}
                      className={cn(
                        "flex w-full flex-col items-start px-4 py-3 text-left text-sm transition-colors duration-[220ms] ease-out hover:bg-secondary/50",
                        selected?.childId === row.childId && "bg-secondary/60",
                      )}
                    >
                      <span className="font-medium text-foreground">{row.childName}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.parentEmail}
                        {row.parentName ? ` · ${row.parentName}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {selected ? (
              <p className="text-xs text-primary">{t("selectedChild", { name: selected.childName })}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="doctor" className="text-sm font-medium">
              {t("doctor")}
            </label>
            <select
              id="doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("doctorCustom")}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.displayName}
                </option>
              ))}
            </select>
            <TextField
              id="doctorName"
              label={t("doctorName")}
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
            />
          </div>

          <TextField
            id="appointmentDate"
            label={t("appointmentDate")}
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
          />

          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-medium">
              {t("summary")}
            </label>
            <textarea
              id="summary"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("summaryPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pdf" className="text-sm font-medium">
              {t("pdf")}
            </label>
            <div className="flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-secondary/40 p-6">
              <Upload className="size-8 text-muted-foreground" aria-hidden />
              <input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
              {pdfFile ? (
                <p className="text-xs text-muted-foreground">{pdfFile.name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("pdfHint")}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!selected) {
                toast.error(t("errors.selectChild"));
                return;
              }
              setConfirmOpen(true);
            }}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
              "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-primary/92 active:scale-[0.98] disabled:opacity-60",
            )}
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </div>

        <div className="rounded-[1.25rem] bg-secondary/30 p-6 ring-1 ring-border/50">
          <h2 className="font-display text-lg text-foreground">{t("checklistTitle")}</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>{t("checklist1")}</li>
            <li>{t("checklist2")}</li>
            <li>{t("checklist3")}</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirm.title")}
        description={
          selected
            ? t("confirm.body", {
                child: selected.childName,
                parent: selected.parentEmail,
              })
            : ""
        }
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.cancel")}
        onConfirm={() => void submit(false)}
        loading={pending}
      />

      <ConfirmDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        title={t("duplicate.title")}
        description={t("duplicate.body")}
        confirmLabel={t("duplicate.confirm")}
        cancelLabel={t("duplicate.cancel")}
        onConfirm={() => void submit(true)}
        loading={pending}
      />
    </div>
  );
}
