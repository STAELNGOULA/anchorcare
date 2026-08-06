import {
  DOCTOR_LANGUAGE_OPTIONS,
  DOCTOR_SPECIALTY_VALUES,
  type DoctorSpecialty,
} from "@/lib/doctors/doctor-specialties";
import { isValidBookingUrl } from "@/lib/doctors/booking-url";
import type { CountryCode } from "@/lib/geo/regions";
import { getRegionsForCountry } from "@/lib/geo/regions";

const LANGUAGE_CODES = new Set<string>(
  DOCTOR_LANGUAGE_OPTIONS.map((l) => l.code),
);

export function parseDoctorSpecialty(value: unknown): DoctorSpecialty | null {
  if (
    typeof value === "string" &&
    (DOCTOR_SPECIALTY_VALUES as readonly string[]).includes(value)
  ) {
    return value as DoctorSpecialty;
  }
  return null;
}

export function parseDoctorLanguages(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const codes = value.filter((v): v is string => typeof v === "string");
  if (!codes.length || !codes.every((c) => LANGUAGE_CODES.has(c))) {
    return null;
  }
  return [...new Set(codes)];
}

export function validateDoctorInput(input: {
  displayName?: unknown;
  photoUrl?: unknown;
  bio?: unknown;
  specialty?: unknown;
  languages?: unknown;
  country?: unknown;
  region?: unknown;
  bookingUrl?: unknown;
  isFeatured?: unknown;
  sortOrder?: unknown;
}): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const displayName =
    typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (!displayName || displayName.length > 120) {
    return { ok: false, error: "invalid_name" };
  }

  const specialty = parseDoctorSpecialty(input.specialty);
  if (!specialty) {
    return { ok: false, error: "invalid_specialty" };
  }

  const languages = parseDoctorLanguages(input.languages);
  if (!languages) {
    return { ok: false, error: "invalid_languages" };
  }

  const country = input.country;
  if (country !== "US" && country !== "CA") {
    return { ok: false, error: "invalid_country" };
  }

  const region =
    typeof input.region === "string" && input.region.trim()
      ? input.region.trim()
      : null;

  if (region) {
    const validRegions = getRegionsForCountry(country as CountryCode).map((r) => r.code);
    if (!validRegions.includes(region)) {
      return { ok: false, error: "invalid_region" };
    }
  }

  const bookingUrl =
    typeof input.bookingUrl === "string" ? input.bookingUrl.trim() : "";
  if (!bookingUrl || !isValidBookingUrl(bookingUrl)) {
    return { ok: false, error: "invalid_booking_url" };
  }

  const photoUrl =
    typeof input.photoUrl === "string" && input.photoUrl.trim()
      ? input.photoUrl.trim()
      : null;

  const bio =
    typeof input.bio === "string" && input.bio.trim() ? input.bio.trim() : null;
  if (bio && bio.length > 4000) {
    return { ok: false, error: "invalid_bio" };
  }

  const isFeatured = input.isFeatured === true;
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? Math.max(0, Math.min(9999, Math.round(input.sortOrder)))
      : 0;

  return {
    ok: true,
    data: {
      displayName,
      photoUrl,
      bio,
      specialty,
      languages,
      country,
      region,
      bookingUrl,
      isFeatured,
      sortOrder,
    },
  };
}
