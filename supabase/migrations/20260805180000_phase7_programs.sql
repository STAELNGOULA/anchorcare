-- Phase 7: Programs — pricing, public listing, Stripe Connect, coach assignments

CREATE TYPE public.billing_interval AS ENUM (
  'one_time',
  'monthly',
  'season',
  'weekly'
);

CREATE TYPE public.program_kind AS ENUM (
  'camp',
  'class',
  'team',
  'daycare_room',
  'after_school',
  'other'
);

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at TIMESTAMPTZ;

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS program_type public.program_kind NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS age_min INTEGER,
  ADD COLUMN IF NOT EXISTS age_max INTEGER,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS internal_description TEXT,
  ADD COLUMN IF NOT EXISTS price_amount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS billing_interval public.billing_interval NOT NULL DEFAULT 'season',
  ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS sibling_discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS price_display TEXT,
  ADD COLUMN IF NOT EXISTS price_note TEXT,
  ADD COLUMN IF NOT EXISTS require_payment_before_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS public_listing_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_headline TEXT,
  ADD COLUMN IF NOT EXISTS public_description TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS age_range_label TEXT,
  ADD COLUMN IF NOT EXISTS schedule_summary TEXT,
  ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_on_page BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label TEXT NOT NULL DEFAULT 'Book & pay';

ALTER TABLE public.programs
  ADD CONSTRAINT programs_price_amount_nonneg CHECK (price_amount_cents >= 0),
  ADD CONSTRAINT programs_deposit_nonneg CHECK (deposit_amount_cents IS NULL OR deposit_amount_cents >= 0),
  ADD CONSTRAINT programs_sibling_discount_range CHECK (
    sibling_discount_percent IS NULL OR (sibling_discount_percent >= 0 AND sibling_discount_percent <= 100)
  ),
  ADD CONSTRAINT programs_currency_check CHECK (currency IN ('USD', 'CAD')),
  ADD CONSTRAINT programs_capacity_positive CHECK (capacity IS NULL OR capacity > 0);

CREATE INDEX IF NOT EXISTS idx_programs_org_status ON public.programs (org_id, status);

CREATE TABLE IF NOT EXISTS public.program_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_program_coaches_user ON public.program_coaches (user_id);
CREATE INDEX IF NOT EXISTS idx_program_coaches_program ON public.program_coaches (program_id);

ALTER TABLE public.program_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY program_coaches_member_select ON public.program_coaches
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = program_coaches.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

CREATE POLICY program_coaches_director_write ON public.program_coaches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = program_coaches.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

DROP POLICY IF EXISTS programs_member_select ON public.programs;

CREATE POLICY programs_director_staff_select ON public.programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = programs.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

CREATE POLICY programs_coach_assigned_select ON public.programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = programs.id AND pc.user_id = auth.uid()
    )
  );
