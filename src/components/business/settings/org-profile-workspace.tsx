"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CountryRegionFields } from "@/components/auth/country-region-fields";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { OrgProfileSidebar } from "@/components/business/settings/org-profile-sidebar";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/business/page-header";
import { ORG_TYPE_VALUES, type OrgType } from "@/lib/business/org-types";
import type { OrgProfile } from "@/lib/business/org-profile-types";
import { computeProfileCompletion } from "@/lib/business/org-profile-validation";

type OrgProfileWorkspaceProps = {
  initialProfile: OrgProfile;
};

const PROFILE_ERROR_KEYS = [
  "saveFailed",
  "validationError",
  "publishRequirements",
  "slugTaken",
  "slugInvalid",
  "regionInvalid",
  "forbidden",
  "notFound",
  "invalidBody",
  "unauthorized",
] as const;

type ProfileErrorKey = (typeof PROFILE_ERROR_KEYS)[number];

function toProfileErrorKey(code?: string): ProfileErrorKey {
  if (code && (PROFILE_ERROR_KEYS as readonly string[]).includes(code)) {
    return code as ProfileErrorKey;
  }
  return "saveFailed";
}

export function OrgProfileWorkspace({ initialProfile }: OrgProfileWorkspaceProps) {
  const t = useTranslations("business.settings.profileEditor");
  const [profile, setProfile] = useState(initialProfile);
  const [pending, setPending] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orgTypeOptions = useMemo(
    () =>
      ORG_TYPE_VALUES.map((type) => ({
        value: type,
        label: t(`orgType.${type}`),
      })),
    [t],
  );

  const completion = useMemo(() => computeProfileCompletion(profile), [profile]);

  const publicPath = `/p/${profile.publicSlug}`;
  const previewPath = `${publicPath}?preview=1`;

  const save = useCallback(
    async (next: OrgProfile) => {
      setPending(true);
      try {
        const res = await fetch("/api/business/org-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: next.name,
            orgType: next.orgType,
            website: next.website ?? "",
            internalNotes: next.internalNotes ?? "",
            jurisdictionCountry: next.jurisdictionCountry,
            jurisdictionRegion: next.jurisdictionRegion,
            addressLine1: next.addressLine1,
            city: next.city,
            region: next.region,
            postalCode: next.postalCode,
            country: next.country,
            publicDescription: next.publicDescription ?? "",
            publicPhone: next.publicPhone ?? "",
            publicEmail: next.publicEmail ?? "",
            galleryImages: next.galleryImages,
            hoursJson: next.hoursJson,
            accreditations: next.accreditations,
            socialLinks: next.socialLinks,
          }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          profile?: OrgProfile;
          error?: string;
          fieldErrors?: Record<string, string[] | undefined>;
        };

        if (!res.ok || !data.ok || !data.profile) {
          const firstFieldError = data.fieldErrors
            ? Object.entries(data.fieldErrors)
                .flatMap(([field, messages]) =>
                  (messages ?? []).map((message) => `${field}: ${message}`),
                )
                .at(0)
            : undefined;
          toast.error(firstFieldError ?? t(toProfileErrorKey(data.error)));
          return false;
        }

        setProfile(data.profile);
        setSavedAt(new Date());
        return true;
      } catch {
        toast.error(t("saveFailed"));
        return false;
      } finally {
        setPending(false);
      }
    },
    [t],
  );

  const scheduleSave = useCallback(
    (next: OrgProfile) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void save(next);
      }, 2000);
    },
    [save],
  );

  const update = <K extends keyof OrgProfile>(key: K, value: OrgProfile[K]) => {
    setProfile((prev) => {
      const next = { ...prev, [key]: value };
      scheduleSave(next);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/business/settings"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("backToSettings")}
        </Link>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
          <div className="flex justify-end">
            {pending ? (
              <span className="text-xs text-muted-foreground">{t("saving")}</span>
            ) : savedAt ? (
              <span className="text-xs text-muted-foreground">{t("saved")}</span>
            ) : null}
          </div>

          <TextField
            id="orgName"
            label={t("legalName")}
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <FormSelectField
            id="orgType"
            label={t("programType")}
            value={profile.orgType}
            onValueChange={(v) => update("orgType", v as OrgType)}
            options={orgTypeOptions}
          />
          <label className="block space-y-2 text-sm">
            <span className="font-medium">{t("aboutUs")}</span>
            <textarea
              id="aboutUs"
              value={profile.publicDescription ?? ""}
              onChange={(e) => update("publicDescription", e.target.value || null)}
              rows={6}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="phone"
              label={t("phoneNumber")}
              type="tel"
              autoComplete="tel"
              value={profile.publicPhone ?? ""}
              onChange={(e) => update("publicPhone", e.target.value || null)}
            />
            <TextField
              id="email"
              label={t("email")}
              type="email"
              autoComplete="email"
              value={profile.publicEmail ?? ""}
              onChange={(e) => update("publicEmail", e.target.value || null)}
            />
          </div>
          <TextField
            id="website"
            label={t("website")}
            value={profile.website ?? ""}
            onChange={(e) => update("website", e.target.value || null)}
          />
          <CountryRegionFields
            country={profile.jurisdictionCountry}
            region={profile.jurisdictionRegion}
            onCountryChange={(c) => update("jurisdictionCountry", c)}
            onRegionChange={(r) => update("jurisdictionRegion", r)}
          />
          <TextField
            id="address"
            label={t("address")}
            value={profile.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              id="city"
              label={t("city")}
              value={profile.city}
              onChange={(e) => update("city", e.target.value)}
            />
            <TextField
              id="region"
              label={t("region")}
              value={profile.region}
              onChange={(e) => update("region", e.target.value)}
            />
            <TextField
              id="postal"
              label={t("postal")}
              value={profile.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
            />
          </div>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">{t("internalNotes")}</span>
            <textarea
              value={profile.internalNotes ?? ""}
              onChange={(e) => update("internalNotes", e.target.value || null)}
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <OrgProfileSidebar
          previewPath={previewPath}
          publicPath={publicPath}
          completion={completion}
          previewDevice={previewDevice}
          onPreviewDeviceChange={setPreviewDevice}
        />
      </div>
    </div>
  );
}
