-- Phase 11: Unified registration, waivers, audit, payments

ALTER TABLE public.program_registrations
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS health_snapshot JSONB;

CREATE TABLE IF NOT EXISTS public.registration_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_waivers_registration_id
  ON public.registration_waivers (registration_id);

ALTER TABLE public.registration_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_waivers_parent_select ON public.registration_waivers
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY registration_waivers_deny_client_write ON public.registration_waivers
  FOR INSERT WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.registration_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_audit_registration_id
  ON public.registration_audit (registration_id, created_at DESC);

ALTER TABLE public.registration_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_audit_deny_client ON public.registration_audit
  FOR ALL USING (false);

CREATE TABLE IF NOT EXISTS public.registration_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_payments_registration_id
  ON public.registration_payments (registration_id);

ALTER TABLE public.registration_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_payments_deny_client ON public.registration_payments
  FOR ALL USING (false);

-- Directors can read registrations for their org
CREATE POLICY program_registrations_org_member_select ON public.program_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = program_registrations.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

CREATE OR REPLACE FUNCTION public.log_registration_audit(
  p_registration_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registration_audit (registration_id, actor_id, action, metadata)
  VALUES (p_registration_id, p_actor_id, p_action, coalesce(p_metadata, '{}'::jsonb));
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
  v_registration public.program_registrations%ROWTYPE;
  v_program public.programs%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_registration
  FROM public.program_registrations
  WHERE stripe_checkout_session_id = p_checkout_session_id
    AND payment_status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_program FROM public.programs WHERE id = v_registration.program_id;

  UPDATE public.program_registrations
  SET
    payment_status = 'paid',
    amount_paid_cents = p_amount_paid_cents,
    paid_at = v_now,
    status = CASE
      WHEN v_program.require_payment_before_approval THEN 'active'
      ELSE status
    END,
    approved_at = CASE
      WHEN v_program.require_payment_before_approval AND approved_at IS NULL THEN v_now
      ELSE approved_at
    END,
    updated_at = v_now
  WHERE id = v_registration.id;

  INSERT INTO public.registration_payments (
    registration_id, stripe_checkout_session_id, amount_cents, currency, status, paid_at
  )
  VALUES (
    v_registration.id,
    p_checkout_session_id,
    p_amount_paid_cents,
    coalesce(v_program.currency, 'usd'),
    'paid',
    v_now
  )
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING;

  PERFORM public.log_registration_audit(
    v_registration.id,
    v_registration.parent_id,
    'payment_completed',
    jsonb_build_object('amount_cents', p_amount_paid_cents)
  );

  RETURN v_registration.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_registration_waiver(
  p_user_id UUID,
  p_registration_id UUID,
  p_guardian_name TEXT,
  p_signature_data TEXT,
  p_health_snapshot JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg public.program_registrations%ROWTYPE;
  v_waiver_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_guardian_name IS NULL OR length(trim(p_guardian_name)) < 2 THEN
    RAISE EXCEPTION 'waiver_required';
  END IF;

  IF p_signature_data IS NULL OR length(trim(p_signature_data)) < 20 THEN
    RAISE EXCEPTION 'signature_required';
  END IF;

  SELECT * INTO v_reg
  FROM public.program_registrations
  WHERE id = p_registration_id AND parent_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'registration_not_found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.registration_waivers WHERE registration_id = p_registration_id) THEN
    RAISE EXCEPTION 'waiver_immutable';
  END IF;

  INSERT INTO public.registration_waivers (
    registration_id, parent_id, guardian_name, signature_data, signed_at
  )
  VALUES (
    p_registration_id,
    p_user_id,
    trim(p_guardian_name),
    p_signature_data,
    v_now
  )
  RETURNING id INTO v_waiver_id;

  UPDATE public.program_registrations
  SET
    waiver_guardian_name = trim(p_guardian_name),
    waiver_accepted_at = v_now,
    health_snapshot = coalesce(p_health_snapshot, health_snapshot),
    updated_at = v_now
  WHERE id = p_registration_id;

  PERFORM public.log_registration_audit(
    p_registration_id,
    p_user_id,
    'waiver_signed',
    jsonb_build_object('waiver_id', v_waiver_id)
  );

  RETURN v_waiver_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_registration(
  p_user_id UUID,
  p_registration_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg public.program_registrations%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_reg FROM public.program_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = v_reg.org_id
      AND om.user_id = p_user_id
      AND om.role IN ('director', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_reg.status = 'withdrawn' THEN
    RAISE EXCEPTION 'registration_withdrawn';
  END IF;

  UPDATE public.program_registrations
  SET status = 'active', approved_at = v_now, approved_by = p_user_id, updated_at = v_now
  WHERE id = p_registration_id;

  PERFORM public.log_registration_audit(
    p_registration_id,
    p_user_id,
    'approved',
    '{}'::jsonb
  );

  RETURN p_registration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_registration(
  p_user_id UUID,
  p_registration_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg public.program_registrations%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_reg FROM public.program_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = v_reg.org_id
      AND om.user_id = p_user_id
      AND om.role IN ('director', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.program_registrations
  SET
    status = 'withdrawn',
    rejected_at = v_now,
    rejection_reason = nullif(trim(p_reason), ''),
    updated_at = v_now
  WHERE id = p_registration_id;

  PERFORM public.log_registration_audit(
    p_registration_id,
    p_user_id,
    'rejected',
    jsonb_build_object('reason', p_reason)
  );

  RETURN p_registration_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_registration_audit FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_registration_waiver FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_registration FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_registration FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_checkout_registration FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.sign_registration_waiver TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_checkout_registration TO service_role;
