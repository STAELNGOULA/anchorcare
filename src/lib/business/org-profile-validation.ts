import { z } from "zod";
import { ORG_TYPE_VALUES } from "@/lib/business/org-types";
import { isValidPublicSlug } from "@/lib/business/slug";
import { isValidRegion, type CountryCode } from "@/lib/geo/regions";
import {
  normalizeHoursJson,
  normalizeOptionalWebsite,
} from "@/lib/business/org-profile-types";

const emptyToUndefined = (value: unknown) => {
  if (value == null || value === "") return undefined;
  return value;
};

const galleryImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(120).default(""),
  order: z.number().int().min(0).max(5),
});

const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: z.string().max(5),
  close: z.string().max(5),
});

const hoursSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

const socialSchema = z.object({
  instagram: z.string().max(200).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  tiktok: z.string().max(200).optional().or(z.literal("")),
});

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().max(500).nullable().optional(),
);

const optionalWebsite = z.preprocess((value) => {
  const normalized = normalizeOptionalWebsite(value);
  return normalized ?? undefined;
}, z.string().url().max(200).optional());

export const orgProfilePatchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    orgType: z.enum(ORG_TYPE_VALUES).optional(),
    website: optionalWebsite,
    internalNotes: z.string().max(2000).optional(),
    jurisdictionCountry: z.enum(["US", "CA"]).optional(),
    jurisdictionRegion: z.string().trim().min(1).max(80).optional(),
    addressLine1: z.string().trim().min(3).max(200).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    region: z.string().trim().min(1).max(80).optional(),
    postalCode: z.string().trim().min(3).max(20).optional(),
    country: z.enum(["US", "CA"]).optional(),
    logoUrl: optionalUrl,
    coverImageUrl: optionalUrl,
    publicSlug: z.string().trim().min(3).max(40).optional(),
    publicPageEnabled: z.boolean().optional(),
    publicHeadline: z.string().trim().min(2).max(80).optional(),
    publicTagline: z.string().trim().max(160).optional().or(z.literal("")),
    publicDescription: z.string().max(8000).optional(),
    publicPhone: z.string().trim().max(30).optional().or(z.literal("")),
    // Draft-friendly: format checked only when publishing (see canPublishProfile).
    publicEmail: z.string().trim().max(120).optional().or(z.literal("")),
    galleryImages: z.array(galleryImageSchema).max(6).optional(),
    hoursJson: z.preprocess(
      (value) => normalizeHoursJson(value),
      hoursSchema,
    ).optional(),
    accreditations: z.array(z.string().trim().max(120)).max(8).optional(),
    socialLinks: socialSchema.optional(),
    seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
    seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
    brandAccentColor: z.string().trim().max(7).optional(),
  })
  .refine(
    (data) => {
      if (!data.publicSlug) return true;
      return isValidPublicSlug(data.publicSlug);
    },
    { message: "slugInvalid", path: ["publicSlug"] },
  )
  .refine(
    (data) => {
      if (!data.jurisdictionCountry || !data.jurisdictionRegion) return true;
      return isValidRegion(
        data.jurisdictionCountry as CountryCode,
        data.jurisdictionRegion,
      );
    },
    { message: "regionInvalid", path: ["jurisdictionRegion"] },
  );

export type OrgProfilePatch = z.infer<typeof orgProfilePatchSchema>;

function hasValidPublicEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return z.string().email().safeParse(email.trim()).success;
}

export function canPublishProfile(input: {
  publicSlug: string;
  publicHeadline: string;
  logoUrl: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
}): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!input.publicSlug || !isValidPublicSlug(input.publicSlug)) missing.push("slug");
  if (!input.publicHeadline?.trim()) missing.push("headline");
  if (!input.logoUrl) missing.push("logo");
  const hasPhone = Boolean(input.publicPhone?.trim());
  const hasEmail = hasValidPublicEmail(input.publicEmail);
  if (!hasPhone && !hasEmail) missing.push("contact");
  if (input.publicEmail?.trim() && !hasEmail) missing.push("contactEmail");
  return { ok: missing.length === 0, missing };
}

export function computeProfileCompletion(profile: {
  logoUrl: string | null;
  coverImageUrl: string | null;
  publicHeadline: string;
  publicTagline: string | null;
  publicDescription: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  galleryImages: { url: string }[];
  hoursJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
}): number {
  const checks = [
    Boolean(profile.logoUrl),
    Boolean(profile.coverImageUrl),
    Boolean(profile.publicHeadline?.trim()),
    Boolean(profile.publicTagline?.trim()),
    Boolean(profile.publicDescription?.trim()),
    Boolean(profile.publicPhone?.trim() || profile.publicEmail?.trim()),
    profile.galleryImages.length > 0,
    Object.keys(profile.hoursJson ?? {}).length > 0,
    Boolean(profile.seoTitle?.trim()),
    Boolean(profile.seoDescription?.trim()),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function computeSeoScore(profile: {
  publicHeadline: string;
  seoTitle: string | null;
  seoDescription: string | null;
}): { score: number; tips: string[] } {
  const tips: string[] = [];
  let score = 0;
  const headlineLen = profile.publicHeadline?.length ?? 0;
  if (headlineLen >= 20 && headlineLen <= 60) score += 35;
  else tips.push("headlineLength");
  const titleLen = profile.seoTitle?.length ?? 0;
  if (titleLen >= 30 && titleLen <= 60) score += 35;
  else tips.push("seoTitleLength");
  const descLen = profile.seoDescription?.length ?? 0;
  if (descLen >= 80 && descLen <= 155) score += 30;
  else tips.push("seoDescLength");
  return { score, tips };
}
