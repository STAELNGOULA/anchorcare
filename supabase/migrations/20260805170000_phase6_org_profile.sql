-- Phase 6: Organization profile + public page fields

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS public_page_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_headline TEXT,
  ADD COLUMN IF NOT EXISTS public_tagline TEXT,
  ADD COLUMN IF NOT EXISTS public_description TEXT,
  ADD COLUMN IF NOT EXISTS public_phone TEXT,
  ADD COLUMN IF NOT EXISTS public_email TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hours_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS accreditations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS brand_accent_color TEXT NOT NULL DEFAULT '#4ECDC4',
  ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN NOT NULL DEFAULT false;

-- Backfill headline from onboarding suggestion
UPDATE public.organizations
SET public_headline = suggested_headline
WHERE public_headline IS NULL AND suggested_headline IS NOT NULL;

UPDATE public.organizations
SET public_headline = name || '''s program'
WHERE public_headline IS NULL;

CREATE OR REPLACE VIEW public.public_org_profiles
WITH (security_invoker = true)
AS
SELECT
  id,
  public_slug,
  name,
  org_type,
  public_headline,
  public_tagline,
  public_description,
  logo_url,
  cover_image_url,
  gallery_images,
  public_phone,
  public_email,
  address_line1,
  city,
  region,
  postal_code,
  country,
  hours_json,
  accreditations,
  social_links,
  seo_title,
  seo_description,
  brand_accent_color,
  verified_badge
FROM public.organizations
WHERE public_page_enabled = true;

GRANT SELECT ON public.public_org_profiles TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-media',
  'org-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;
