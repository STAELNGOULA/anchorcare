"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CountryRegionFields } from "@/components/auth/country-region-fields";
import { DoctorPreviewCard } from "@/components/doctors/doctor-preview-card";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/business/page-header";
import {
  DOCTOR_LANGUAGE_OPTIONS,
  DOCTOR_SPECIALTY_VALUES,
} from "@/lib/doctors/doctor-specialties";
import type { DoctorRecord } from "@/lib/doctors/doctor-types";
import type { CountryCode } from "@/lib/geo/regions";
import { cn } from "@/lib/utils";

type AdminDoctorFormProps = {
  doctorId?: string;
};

type FormState = {
  displayName: string;
  photoUrl: string;
  bio: string;
  specialty: string;
  languages: string[];
  country: CountryCode;
  region: string;
  bookingUrl: string;
  isFeatured: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  displayName: "",
  photoUrl: "",
  bio: "",
  specialty: "pediatrics",
  languages: ["en"],
  country: "CA",
  region: "",
  bookingUrl: "",
  isFeatured: false,
  sortOrder: 0,
};

function doctorToForm(doctor: DoctorRecord): FormState {
  return {
    displayName: doctor.displayName,
    photoUrl: doctor.photoUrl ?? "",
    bio: doctor.bio ?? "",
    specialty: doctor.specialty,
    languages: doctor.languages.length ? doctor.languages : ["en"],
    country: doctor.country,
    region: doctor.region ?? "",
    bookingUrl: doctor.bookingUrl,
    isFeatured: doctor.isFeatured,
    sortOrder: doctor.sortOrder,
  };
}

export function AdminDoctorForm({ doctorId }: AdminDoctorFormProps) {
  const t = useTranslations("admin.doctors.form");
  const tSpecialty = useTranslations("admin.doctors.specialty");
  const router = useRouter();
  const isEdit = Boolean(doctorId);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);

  const previewDoctor = useMemo(
    () => ({
      displayName: form.displayName || t("previewPlaceholder"),
      photoUrl: form.photoUrl || null,
      specialty: (form.specialty || "pediatrics") as DoctorRecord["specialty"],
      country: form.country,
      bio: form.bio || null,
      languages: form.languages,
    }),
    [form, t],
  );

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setForm(doctorToForm(data.doctor));
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLanguage = (code: string) => {
    setForm((prev) => {
      const has = prev.languages.includes(code);
      const languages = has
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code];
      return { ...prev, languages: languages.length ? languages : [code] };
    });
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/doctors/upload", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error("upload_failed");
      setForm((prev) => ({ ...prev, photoUrl: data.url }));
      toast.success(t("photoUploaded"));
    } catch {
      toast.error(t("photoUploadError"));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setPending(true);
    try {
      const payload = {
        displayName: form.displayName,
        photoUrl: form.photoUrl || null,
        bio: form.bio || null,
        specialty: form.specialty,
        languages: form.languages,
        country: form.country,
        region: form.region || null,
        bookingUrl: form.bookingUrl,
        isFeatured: form.isFeatured,
        sortOrder: form.sortOrder,
      };

      const res = await fetch(
        isEdit ? `/api/admin/doctors/${doctorId}` : "/api/admin/doctors",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(t(`errors.${data.error as string}`) || t("saveError"));
        return;
      }

      toast.success(t("saved"));
      router.push(
        isEdit ? `/admin/doctors/${doctorId}` : `/admin/doctors/${data.doctor.id}`,
      );
      router.refresh();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEdit ? t("editTitle") : t("createTitle")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
          <TextField
            id="displayName"
            label={t("displayName")}
            value={form.displayName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, displayName: e.target.value }))
            }
            required
          />

          <div className="space-y-2">
            <label htmlFor="photo" className="text-sm font-medium">
              {t("photo")}
            </label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
              className="block w-full text-sm"
            />
            {form.photoUrl ? (
              <input
                type="url"
                value={form.photoUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, photoUrl: e.target.value }))
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                placeholder={t("photoUrlPlaceholder")}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              {t("bio")}
            </label>
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="specialty" className="text-sm font-medium">
              {t("specialty")}
            </label>
            <select
              id="specialty"
              value={form.specialty}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, specialty: e.target.value }))
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {DOCTOR_SPECIALTY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {tSpecialty(value)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("languages")}</p>
            <div className="flex flex-wrap gap-2">
              {DOCTOR_LANGUAGE_OPTIONS.map((lang) => {
                const active = form.languages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-[220ms] ease-out",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          <CountryRegionFields
            country={form.country}
            region={form.region}
            onCountryChange={(country) =>
              setForm((prev) => ({ ...prev, country, region: "" }))
            }
            onRegionChange={(region) => setForm((prev) => ({ ...prev, region }))}
          />

          <TextField
            id="bookingUrl"
            label={t("bookingUrl")}
            hint={t("bookingUrlHint")}
            value={form.bookingUrl}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bookingUrl: e.target.value }))
            }
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                }
                className="size-4 rounded border-input"
              />
              {t("featured")}
            </label>
            <TextField
              id="sortOrder"
              label={t("sortOrder")}
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void save()}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
                "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-primary/92 active:scale-[0.98] disabled:opacity-60",
              )}
            >
              {pending ? t("saving") : t("save")}
            </button>
            <Link
              href="/admin/doctors"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm text-muted-foreground hover:text-foreground"
            >
              {t("cancel")}
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("preview")}
          </p>
          <DoctorPreviewCard doctor={previewDoctor} />
        </div>
      </div>
    </div>
  );
}
