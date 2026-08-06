"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  COUNTRY_OPTIONS,
  getRegionsForCountry,
  type CountryCode,
} from "@/lib/geo/regions";
import { cn } from "@/lib/utils";

type CountryRegionFieldsProps = {
  country: CountryCode;
  region: string;
  onCountryChange: (country: CountryCode) => void;
  onRegionChange: (region: string) => void;
  countryError?: string;
  regionError?: string;
  className?: string;
};

export function CountryRegionFields({
  country,
  region,
  onCountryChange,
  onRegionChange,
  countryError,
  regionError,
  className,
}: CountryRegionFieldsProps) {
  const t = useTranslations("auth");
  const regions = useMemo(() => getRegionsForCountry(country), [country]);

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div className="space-y-2">
        <label htmlFor="country" className="text-sm font-medium leading-none">
          {t("countryLabel")}
        </label>
        <select
          id="country"
          name="country"
          required
          value={country}
          onChange={(e) => {
            onCountryChange(e.target.value as CountryCode);
            onRegionChange("");
          }}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            countryError && "border-destructive",
          )}
          aria-invalid={countryError ? true : undefined}
        >
          <option value="" disabled>
            {t("countryPlaceholder")}
          </option>
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        {countryError ? (
          <p className="text-xs text-destructive" role="alert">
            {countryError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="region" className="text-sm font-medium leading-none">
          {country === "CA" ? t("provinceLabel") : t("stateLabel")}
        </label>
        <select
          id="region"
          name="region"
          required
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            regionError && "border-destructive",
          )}
          aria-invalid={regionError ? true : undefined}
        >
          <option value="" disabled>
            {country === "CA" ? t("provincePlaceholder") : t("statePlaceholder")}
          </option>
          {regions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        {regionError ? (
          <p className="text-xs text-destructive" role="alert">
            {regionError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
