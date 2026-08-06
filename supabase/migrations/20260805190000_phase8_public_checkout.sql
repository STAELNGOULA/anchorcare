-- Phase 8: Public landing checkout, registration attribution, analytics stub

ALTER TABLE public.program_registrations
  ADD COLUMN IF NOT EXISTS registration_source TEXT NOT NULL DEFAULT 'invite'
    CHECK (registration_source IN ('invite', 'public')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waiver_guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS waiver_accepted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_registrations_checkout_session
  ON public.program_registrations (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_registrations_program_status
  ON public.program_registrations (program_id, status);

CREATE TABLE IF NOT EXISTS public.public_page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'program_click', 'checkout_start', 'checkout_complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_page_events_org_created
  ON public.public_page_events (org_id, created_at DESC);

ALTER TABLE public.public_page_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_page_events_deny_all ON public.public_page_events
  FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.create_public_registration(
  p_user_id UUID,
  p_program_id UUID,
  p_child_id UUID DEFAULT NULL,
  p_new_child_first_name TEXT DEFAULT NULL,
  p_new_child_last_name TEXT DEFAULT NULL,
  p_new_child_dob DATE DEFAULT NULL,
  p_waiver_guardian_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program public.programs%ROWTYPE;
  v_child_id UUID;
  v_registration_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_enrollment_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_waiver_guardian_name IS NULL OR length(trim(p_waiver_guardian_name)) < 2 THEN
    RAISE EXCEPTION 'waiver_required';
  END IF;

  SELECT * INTO v_program
  FROM public.programs
  WHERE id = p_program_id
    AND status = 'active'
    AND public_listing_enabled = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'program_not_available';
  END IF;

  IF v_program.registration_opens_at IS NOT NULL AND v_program.registration_opens_at > v_now THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;

  IF v_program.registration_closes_at IS NOT NULL AND v_program.registration_closes_at < v_now THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;

  IF v_program.capacity IS NOT NULL THEN
    SELECT count(*)::INTEGER INTO v_enrollment_count
    FROM public.program_registrations
    WHERE program_id = v_program.id AND status IN ('pending', 'active');

    IF v_enrollment_count >= v_program.capacity AND NOT v_program.waitlist_enabled THEN
      RAISE EXCEPTION 'program_full';
    END IF;
  END IF;

  IF p_child_id IS NOT NULL THEN
    SELECT id INTO v_child_id
    FROM public.children
    WHERE id = p_child_id AND parent_id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'child_not_found';
    END IF;
  ELSIF p_new_child_first_name IS NOT NULL AND length(trim(p_new_child_first_name)) >= 1 THEN
    INSERT INTO public.children (parent_id, first_name, last_name, date_of_birth)
    VALUES (
      p_user_id,
      trim(p_new_child_first_name),
      coalesce(trim(p_new_child_last_name), ''),
      p_new_child_dob
    )
    RETURNING id INTO v_child_id;
  ELSE
    RAISE EXCEPTION 'child_required';
  END IF;

  UPDATE public.profiles
  SET role = 'parent', onboarding_status = 'active', updated_at = v_now
  WHERE id = p_user_id;

  INSERT INTO public.program_registrations (
    program_id,
    org_id,
    child_id,
    parent_id,
    status,
    registration_source,
    payment_status,
    waiver_guardian_name,
    waiver_accepted_at
  )
  VALUES (
    v_program.id,
    v_program.org_id,
    v_child_id,
    p_user_id,
    CASE
      WHEN v_program.price_amount_cents > 0 AND v_program.require_payment_before_approval THEN 'pending'
      ELSE 'active'
    END,
    'public',
    CASE
      WHEN v_program.price_amount_cents > 0 THEN 'pending'
      ELSE 'not_required'
    END,
    trim(p_waiver_guardian_name),
    v_now
  )
  ON CONFLICT (program_id, child_id) DO UPDATE
  SET
    registration_source = 'public',
    waiver_guardian_name = EXCLUDED.waiver_guardian_name,
    waiver_accepted_at = EXCLUDED.waiver_accepted_at,
    updated_at = v_now
  RETURNING id INTO v_registration_id;

  RETURN v_registration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_checkout_registration(
  p_checkout_session_id TEXT,
  p_amount_paid_cents INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  UPDATE public.program_registrations
  SET
    payment_status = 'paid',
    amount_paid_cents = p_amount_paid_cents,
    paid_at = v_now,
    status = 'active',
    updated_at = v_now
  WHERE stripe_checkout_session_id = p_checkout_session_id
    AND payment_status = 'pending'
  RETURNING id INTO v_registration_id;

  RETURN v_registration_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_registration FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_checkout_registration FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_checkout_registration TO service_role;
