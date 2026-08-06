import {
  canPublishProfile,
  type OrgProfilePatch,
} from "@/lib/business/org-profile-validation";
import {
  normalizeBrandAccentColor,
  normalizeHoursJson,
  type GalleryImage,
  type OrgProfile,
  type SocialLinks,
} from "@/lib/business/org-profile-types";
import type { OrgType } from "@/lib/business/org-types";
import type { CountryCode } from "@/lib/geo/regions";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/supabase";

type OrgRow = {
  id: string;
  name: string;
  org_type: OrgType;
  website: string | null;
  internal_notes: string | null;
  jurisdiction_country: string;
  jurisdiction_region: string;
  address_line1: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  logo_url: string | null;
  cover_image_url: string | null;
  public_slug: string;
  public_page_enabled: boolean;
  public_headline: string | null;
  public_tagline: string | null;
  public_description: string | null;
  public_phone: string | null;
  public_email: string | null;
  gallery_images: unknown;
  hours_json: unknown;
  accreditations: unknown;
  social_links: unknown;
  seo_title: string | null;
  seo_description: string | null;
  brand_accent_color: string;
  verified_badge: boolean;
};

function mapOrg(row: OrgRow): OrgProfile {
  return {
    id: row.id,
    name: row.name,
    orgType: row.org_type,
    website: row.website,
    internalNotes: row.internal_notes,
    jurisdictionCountry: row.jurisdiction_country as CountryCode,
    jurisdictionRegion: row.jurisdiction_region,
    addressLine1: row.address_line1,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    country: row.country as CountryCode,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    publicSlug: row.public_slug,
    publicPageEnabled: row.public_page_enabled,
    publicHeadline: row.public_headline ?? row.name,
    publicTagline: row.public_tagline,
    publicDescription: row.public_description,
    publicPhone: row.public_phone,
    publicEmail: row.public_email,
    galleryImages: Array.isArray(row.gallery_images)
      ? (row.gallery_images as GalleryImage[])
      : [],
    hoursJson: normalizeHoursJson(row.hours_json),
    accreditations: Array.isArray(row.accreditations)
      ? (row.accreditations as string[])
      : [],
    socialLinks: (row.social_links as SocialLinks) ?? {},
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    brandAccentColor: row.brand_accent_color,
    verifiedBadge: row.verified_badge,
  };
}

function stripUnsafeHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export async function getDirectorOrgId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (data?.role !== "business_admin" || !data.org_id) return null;
  return data.org_id;
}

export async function isDirectorOfOrg(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "director";
}

export async function getOrgProfileForDirector(
  userId: string,
): Promise<OrgProfile | null> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrg(data as OrgRow);
}

export async function updateOrgProfile(
  userId: string,
  patch: OrgProfilePatch,
): Promise<
  | { ok: true; profile: OrgProfile }
  | { ok: false; code: string; fieldErrors?: Record<string, string> }
> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId) return { ok: false, code: "forbidden" };

  const director = await isDirectorOfOrg(userId, orgId);
  if (!director) return { ok: false, code: "forbidden" };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();

  if (!current) return { ok: false, code: "notFound" };

  const nextSlug = patch.publicSlug ?? current.public_slug;
  const nextHeadline = patch.publicHeadline ?? current.public_headline ?? current.name;
  const nextLogo = patch.logoUrl !== undefined ? patch.logoUrl : current.logo_url;
  const nextPhone =
    patch.publicPhone !== undefined ? patch.publicPhone || null : current.public_phone;
  const nextEmail =
    patch.publicEmail !== undefined ? patch.publicEmail || null : current.public_email;

  const enabling =
    patch.publicPageEnabled === true ||
    (patch.publicPageEnabled === undefined && current.public_page_enabled);

  if (patch.publicPageEnabled === true || (enabling && patch.publicPageEnabled !== false)) {
    const publishCheck = canPublishProfile({
      publicSlug: nextSlug,
      publicHeadline: nextHeadline,
      logoUrl: nextLogo,
      publicPhone: nextPhone,
      publicEmail: nextEmail,
    });
    if (!publishCheck.ok) {
      return {
        ok: false,
        code: "publishRequirements",
        fieldErrors: { publicPageEnabled: publishCheck.missing.join(",") },
      };
    }
  }

  if (patch.publicSlug && patch.publicSlug !== current.public_slug) {
    const service = createServiceClient();
    const { data: taken } = await service
      .from("organizations")
      .select("id")
      .eq("public_slug", patch.publicSlug)
      .neq("id", orgId)
      .maybeSingle();
    if (taken) {
      return {
        ok: false,
        code: "slugTaken",
        fieldErrors: { publicSlug: "slugTaken" },
      };
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.orgType !== undefined) update.org_type = patch.orgType;
  if (patch.website !== undefined) update.website = patch.website || null;
  if (patch.internalNotes !== undefined) update.internal_notes = patch.internalNotes || null;
  if (patch.jurisdictionCountry !== undefined)
    update.jurisdiction_country = patch.jurisdictionCountry;
  if (patch.jurisdictionRegion !== undefined)
    update.jurisdiction_region = patch.jurisdictionRegion;
  if (patch.addressLine1 !== undefined) update.address_line1 = patch.addressLine1;
  if (patch.city !== undefined) update.city = patch.city;
  if (patch.region !== undefined) update.region = patch.region;
  if (patch.postalCode !== undefined) update.postal_code = patch.postalCode;
  if (patch.country !== undefined) update.country = patch.country;
  if (patch.logoUrl !== undefined) update.logo_url = patch.logoUrl;
  if (patch.coverImageUrl !== undefined) update.cover_image_url = patch.coverImageUrl;
  if (patch.publicSlug !== undefined) update.public_slug = patch.publicSlug;
  if (patch.publicPageEnabled !== undefined)
    update.public_page_enabled = patch.publicPageEnabled;
  if (patch.publicHeadline !== undefined) update.public_headline = patch.publicHeadline;
  if (patch.publicTagline !== undefined) update.public_tagline = patch.publicTagline || null;
  if (patch.publicDescription !== undefined)
    update.public_description = stripUnsafeHtml(patch.publicDescription);
  if (patch.publicPhone !== undefined) update.public_phone = patch.publicPhone || null;
  if (patch.publicEmail !== undefined) update.public_email = patch.publicEmail || null;
  if (patch.galleryImages !== undefined) update.gallery_images = patch.galleryImages;
  if (patch.hoursJson !== undefined) update.hours_json = patch.hoursJson;
  if (patch.accreditations !== undefined) update.accreditations = patch.accreditations;
  if (patch.socialLinks !== undefined) update.social_links = patch.socialLinks;
  if (patch.seoTitle !== undefined) update.seo_title = patch.seoTitle || null;
  if (patch.seoDescription !== undefined)
    update.seo_description = patch.seoDescription || null;
  if (patch.brandAccentColor !== undefined) {
    const color = normalizeBrandAccentColor(patch.brandAccentColor);
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      update.brand_accent_color = color;
    }
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(update as Database["public"]["Tables"]["organizations"]["Update"])
    .eq("id", orgId)
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("organizations_public_slug_format")) {
      return { ok: false, code: "slugInvalid", fieldErrors: { publicSlug: "slugInvalid" } };
    }
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { ok: false, code: "slugTaken", fieldErrors: { publicSlug: "slugTaken" } };
    }
    return { ok: false, code: "saveFailed" };
  }

  return { ok: true, profile: mapOrg(data as OrgRow) };
}

export async function getPublicOrgBySlug(
  slug: string,
  options?: { preview?: boolean; userId?: string },
): Promise<OrgProfile | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("organizations")
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!data) return null;

  if (!data.public_page_enabled) {
    if (!options?.preview || !options.userId) return null;
    const allowed = await isDirectorOfOrg(options.userId, data.id);
    if (!allowed) return null;
  }

  return mapOrg(data as OrgRow);
}
