"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CountryRegionFields } from "@/components/auth/country-region-fields";
import { TextField } from "@/components/forms/text-field";
import { ConfettiBurst } from "@/components/business/onboarding/confetti-burst";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { LocationMapPreview } from "@/components/business/onboarding/location-map-preview";
import { OnboardingStepper } from "@/components/business/onboarding/onboarding-stepper";
import {
  DIRECTOR_ROLE_VALUES,
  type DirectorRole,
} from "@/lib/business/director-roles";
import { ORG_TYPE_VALUES, type OrgType } from "@/lib/business/org-types";
import { slugifyOrgName, suggestHeadline } from "@/lib/business/slug";
import type { CountryCode } from "@/lib/geo/regions";
import { Button } from "@/components/ui/button";

type BusinessOnboardingWizardProps = {
  directorName: string;
};

type FormState = {
  directorName: string;
  directorTitle: DirectorRole | "";
  orgName: string;
  orgType: OrgType;
  jurisdictionCountry: CountryCode;
  jurisdictionRegion: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  publicSlug: string;
  slugTouched: boolean;
};

const INITIAL_FORM = (directorName: string): FormState => ({
  directorName,
  directorTitle: "",
  orgName: "",
  orgType: "daycare",
  jurisdictionCountry: "US",
  jurisdictionRegion: "",
  addressLine1: "",
  city: "",
  postalCode: "",
  publicSlug: "",
  slugTouched: false,
});

const TOTAL_STEPS = 2;

export function BusinessOnboardingWizard({
  directorName,
}: BusinessOnboardingWizardProps) {
  const t = useTranslations("business.onboarding");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => INITIAL_FORM(directorName));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const stepLabels = [t("stepAbout"), t("stepProgram")];

  const directorRoleOptions = useMemo(
    () =>
      DIRECTOR_ROLE_VALUES.map((role) => ({
        value: role,
        label: t(`directorRole.${role}`),
      })),
    [t],
  );

  const orgTypeOptions = useMemo(
    () =>
      ORG_TYPE_VALUES.map((type) => ({
        value: type,
        label: t(`orgType.${type}`),
      })),
    [t],
  );

  const suggestedSlug = useMemo(
    () => (form.orgName ? slugifyOrgName(form.orgName) : ""),
    [form.orgName],
  );

  const displaySlug = form.slugTouched ? form.publicSlug : suggestedSlug;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "orgName" && !prev.slugTouched) {
        next.publicSlug = slugifyOrgName(String(value));
      }
      if (key === "jurisdictionCountry") {
        next.jurisdictionRegion = "";
      }
      return next;
    });
  };

  const validateStep = (current: number): boolean => {
    const errors: Record<string, string> = {};
    if (current === 1) {
      if (form.directorName.trim().length < 2) errors.directorName = "nameMin";
      if (!form.directorTitle) errors.directorTitle = "titleRequired";
    }
    if (current === 2) {
      if (form.orgName.trim().length < 2) errors.orgName = "orgNameRequired";
      if (!form.jurisdictionRegion) errors.jurisdictionRegion = "regionRequired";
      if (form.addressLine1.trim().length < 3) errors.addressLine1 = "addressRequired";
      if (form.city.trim().length < 2) errors.city = "cityRequired";
      if (form.postalCode.trim().length < 3) errors.postalCode = "postalRequired";
      const slug = displaySlug.trim();
      if (slug.length < 3) errors.publicSlug = "slugMin";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const directorTitleLabel = form.directorTitle
      ? t(`directorRole.${form.directorTitle}`)
      : "";

    try {
      const res = await fetch("/api/business/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          directorName: form.directorName,
          directorTitle: directorTitleLabel,
          orgName: form.orgName,
          orgType: form.orgType,
          jurisdictionCountry: form.jurisdictionCountry,
          jurisdictionRegion: form.jurisdictionRegion,
          addressLine1: form.addressLine1,
          city: form.city,
          postalCode: form.postalCode,
          publicSlug: displaySlug,
          skipProgram: true,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (res.ok && data.ok) {
        setCelebrate(true);
        toast.success(t("trialStarted"));
        window.setTimeout(() => {
          router.push("/business/dashboard");
          router.refresh();
        }, 900);
        return;
      }

      if (data.fieldErrors) {
        setFieldErrors(data.fieldErrors);
      }
      setFormError(t((data.error ?? "unknownError") as "unknownError"));
    } catch {
      setFormError(t("unknownError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <ConfettiBurst active={celebrate} />

      <OnboardingStepper
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        labels={stepLabels}
        className="mb-8"
      />

      {step === 1 ? (
        <div className="space-y-5">
          <TextField
            id="directorName"
            label={t("directorName")}
            value={form.directorName}
            onChange={(e) => update("directorName", e.target.value)}
            required
            error={
              fieldErrors.directorName
                ? t(fieldErrors.directorName as "nameMin")
                : undefined
            }
          />
          <FormSelectField
            id="directorTitle"
            label={t("directorTitle")}
            value={form.directorTitle}
            onValueChange={(value) => update("directorTitle", value as DirectorRole)}
            options={directorRoleOptions}
            placeholder={t("directorTitlePlaceholder")}
            required
            error={
              fieldErrors.directorTitle
                ? t(fieldErrors.directorTitle as "titleRequired")
                : undefined
            }
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <TextField
            id="orgName"
            label={t("orgName")}
            value={form.orgName}
            onChange={(e) => update("orgName", e.target.value)}
            required
            error={
              fieldErrors.orgName ? t(fieldErrors.orgName as "orgNameRequired") : undefined
            }
          />

          <FormSelectField
            id="orgType"
            label={t("orgTypeLabel")}
            value={form.orgType}
            onValueChange={(value) => update("orgType", value as OrgType)}
            options={orgTypeOptions}
            required
          />

          <p className="text-sm font-medium text-foreground">{t("locationSection")}</p>

          <CountryRegionFields
            country={form.jurisdictionCountry}
            region={form.jurisdictionRegion}
            onCountryChange={(c) => update("jurisdictionCountry", c)}
            onRegionChange={(r) => update("jurisdictionRegion", r)}
            regionError={
              fieldErrors.jurisdictionRegion
                ? t(fieldErrors.jurisdictionRegion as "regionRequired")
                : undefined
            }
          />

          <TextField
            id="addressLine1"
            label={t("addressLine1")}
            value={form.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
            required
            error={
              fieldErrors.addressLine1
                ? t(fieldErrors.addressLine1 as "addressRequired")
                : undefined
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="city"
              label={t("city")}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
              error={
                fieldErrors.city ? t(fieldErrors.city as "cityRequired") : undefined
              }
            />
            <TextField
              id="postalCode"
              label={t("postalCode")}
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              required
              error={
                fieldErrors.postalCode
                  ? t(fieldErrors.postalCode as "postalRequired")
                  : undefined
              }
            />
          </div>

          <LocationMapPreview
            addressLine1={form.addressLine1}
            city={form.city}
            regionCode={form.jurisdictionRegion}
            postalCode={form.postalCode}
            country={form.jurisdictionCountry}
          />

          <TextField
            id="publicSlug"
            label={t("publicSlug")}
            value={displaySlug}
            onChange={(e) => {
              update("publicSlug", e.target.value);
              update("slugTouched", true);
            }}
            hint={t("publicSlugHint")}
            error={
              fieldErrors.publicSlug
                ? t(fieldErrors.publicSlug as "slugMin")
                : undefined
            }
          />

          {form.orgName ? (
            <div className="rounded-xl border border-border/60 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("headlinePreview")}
              </p>
              <p className="mt-1 text-foreground">{suggestHeadline(form.orgName)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                anchor.care/p/{displaySlug || "your-program"}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p
          className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setStep((s) => s - 1)}
            disabled={pending}
          >
            {t("back")}
          </Button>
        ) : (
          <span />
        )}

        <Button
          type="button"
          className="rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]"
          disabled={pending}
          onClick={() => {
            if (step < TOTAL_STEPS) {
              if (validateStep(step)) setStep((s) => s + 1);
              return;
            }
            if (validateStep(TOTAL_STEPS)) void submit();
          }}
        >
          {pending ? t("finishing") : step === TOTAL_STEPS ? t("finish") : t("continue")}
        </Button>
      </div>
    </>
  );
}
