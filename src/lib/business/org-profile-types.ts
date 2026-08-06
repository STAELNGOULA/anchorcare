import type { OrgType } from "@/lib/business/org-types";
import type { CountryCode } from "@/lib/geo/regions";

export type GalleryImage = {
  url: string;
  alt: string;
  order: number;
};

export type DayHours = {
  closed: boolean;
  open: string;
  close: string;
};

export type HoursJson = Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  DayHours
>;

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
};

export type OrgProfile = {
  id: string;
  name: string;
  orgType: OrgType;
  website: string | null;
  internalNotes: string | null;
  jurisdictionCountry: CountryCode;
  jurisdictionRegion: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: CountryCode;
  logoUrl: string | null;
  coverImageUrl: string | null;
  publicSlug: string;
  publicPageEnabled: boolean;
  publicHeadline: string;
  publicTagline: string | null;
  publicDescription: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  galleryImages: GalleryImage[];
  hoursJson: HoursJson;
  accreditations: string[];
  socialLinks: SocialLinks;
  seoTitle: string | null;
  seoDescription: string | null;
  brandAccentColor: string;
  verifiedBadge: boolean;
};

export const DEFAULT_HOURS: HoursJson = {
  mon: { closed: false, open: "08:00", close: "17:00" },
  tue: { closed: false, open: "08:00", close: "17:00" },
  wed: { closed: false, open: "08:00", close: "17:00" },
  thu: { closed: false, open: "08:00", close: "17:00" },
  fri: { closed: false, open: "08:00", close: "17:00" },
  sat: { closed: true, open: "", close: "" },
  sun: { closed: true, open: "", close: "" },
};

const HOUR_DAYS = Object.keys(DEFAULT_HOURS) as (keyof HoursJson)[];

/** DB default is `{}` — merge with defaults so autosave validation always passes. */
export function normalizeHoursJson(raw: unknown): HoursJson {
  const hours: HoursJson = { ...DEFAULT_HOURS };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return hours;
  }

  for (const day of HOUR_DAYS) {
    const entry = (raw as Record<string, unknown>)[day];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Partial<DayHours>;
    hours[day] = {
      closed: Boolean(row.closed),
      open: typeof row.open === "string" ? row.open : hours[day].open,
      close: typeof row.close === "string" ? row.close : hours[day].close,
    };
  }

  return hours;
}

export function normalizeOptionalWebsite(value: unknown): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const DEFAULT_BRAND_ACCENT = "#4ECDC4";

export function normalizeBrandAccentColor(value: unknown): string {
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim())) {
    return value.trim();
  }
  return DEFAULT_BRAND_ACCENT;
}
