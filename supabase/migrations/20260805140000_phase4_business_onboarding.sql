-- Phase 4: Business onboarding — organizations, programs, org members

CREATE TYPE public.org_type AS ENUM ('daycare', 'sports', 'camp', 'other');

CREATE TYPE public.org_member_role AS ENUM ('director', 'coach', 'staff');

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_type public.org_type NOT NULL,
  jurisdiction_country TEXT NOT NULL CHECK (jurisdiction_country IN ('US', 'CA')),
  jurisdiction_region TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('US', 'CA')),
  public_slug TEXT NOT NULL,
  suggested_headline TEXT,
  director_title TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organizations_public_slug_format CHECK (public_slug ~ '^[a-z0-9-]{3,40}$')
);

CREATE UNIQUE INDEX idx_organizations_public_slug ON public.organizations (public_slug);

CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL DEFAULT 'director',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id),
  UNIQUE (user_id)
);

CREATE INDEX idx_org_members_org_id ON public.org_members (org_id);

CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  program_slug TEXT NOT NULL,
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, program_slug)
);

CREATE INDEX idx_programs_org_id ON public.programs (org_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles (org_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_member_select ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY organizations_director_update ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  );

CREATE POLICY org_members_select_own ON public.org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY programs_member_select ON public.programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = programs.org_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY programs_member_write ON public.programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = programs.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

CREATE OR REPLACE FUNCTION public.complete_business_onboarding(
  p_user_id UUID,
  p_director_name TEXT,
  p_director_title TEXT,
  p_org_name TEXT,
  p_org_type public.org_type,
  p_jurisdiction_country TEXT,
  p_jurisdiction_region TEXT,
  p_address_line1 TEXT,
  p_city TEXT,
  p_region TEXT,
  p_postal_code TEXT,
  p_country TEXT,
  p_public_slug TEXT,
  p_suggested_headline TEXT,
  p_program_name TEXT DEFAULT NULL,
  p_program_start_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_program_slug TEXT;
  v_existing_org UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT org_id INTO v_existing_org FROM public.profiles WHERE id = p_user_id;
  IF v_existing_org IS NOT NULL THEN
    RAISE EXCEPTION 'org_exists';
  END IF;

  IF EXISTS (SELECT 1 FROM public.organizations WHERE public_slug = p_public_slug) THEN
    RAISE EXCEPTION 'slug_taken';
  END IF;

  INSERT INTO public.organizations (
    name,
    org_type,
    jurisdiction_country,
    jurisdiction_region,
    address_line1,
    city,
    region,
    postal_code,
    country,
    public_slug,
    suggested_headline,
    director_title,
    onboarding_completed_at,
    trial_started_at
  ) VALUES (
    p_org_name,
    p_org_type,
    p_jurisdiction_country,
    p_jurisdiction_region,
    p_address_line1,
    p_city,
    p_region,
    p_postal_code,
    p_country,
    p_public_slug,
    p_suggested_headline,
    p_director_title,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_org_id;

  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'director');

  IF p_program_name IS NOT NULL AND length(trim(p_program_name)) > 0 THEN
    v_program_slug := lower(regexp_replace(trim(p_program_name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_program_slug := trim(both '-' from v_program_slug);
    IF length(v_program_slug) < 3 THEN
      v_program_slug := 'program';
    END IF;

    INSERT INTO public.programs (org_id, name, program_slug, start_date, status)
    VALUES (v_org_id, trim(p_program_name), v_program_slug, p_program_start_date, 'draft');
  END IF;

  UPDATE public.profiles
  SET
    org_id = v_org_id,
    full_name = COALESCE(NULLIF(trim(p_director_name), ''), full_name),
    onboarding_status = 'active',
    country = p_country,
    region = p_region,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_business_onboarding FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_business_onboarding FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_business_onboarding TO authenticated;
