-- Phase 44: Registration pay enhancements — promo codes, installments, partial refunds

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS installment_count INTEGER,
  ADD CONSTRAINT programs_installment_count_range CHECK (
    installment_count IS NULL OR (installment_count >= 2 AND installment_count <= 12)
  );

ALTER TABLE public.program_registrations
  DROP CONSTRAINT IF EXISTS program_registrations_payment_status_check;

ALTER TABLE public.program_registrations
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code_id UUID,
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_plan TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS installment_count INTEGER,
  ADD COLUMN IF NOT EXISTS installments_paid INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_due_cents INTEGER,
  ADD COLUMN IF NOT EXISTS refund_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE public.program_registrations
  ADD CONSTRAINT program_registrations_payment_status_check
    CHECK (payment_status IN ('not_required', 'pending', 'partial', 'paid', 'failed', 'refunded')),
  ADD CONSTRAINT program_registrations_payment_plan_check
    CHECK (payment_plan IN ('full', 'installment'));

CREATE TABLE IF NOT EXISTS public.registration_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_cents')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  sibling_only BOOLEAN NOT NULL DEFAULT false,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT registration_promo_codes_org_code_unique UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_registration_promo_codes_org
  ON public.registration_promo_codes (org_id, active);

CREATE TABLE IF NOT EXISTS public.registration_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.registration_promo_codes(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL UNIQUE REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_cents INTEGER NOT NULL CHECK (discount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.registration_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_promo_codes_director_select ON public.registration_promo_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = registration_promo_codes.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

CREATE POLICY registration_promo_codes_director_write ON public.registration_promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = registration_promo_codes.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = registration_promo_codes.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  );

CREATE POLICY registration_promo_redemptions_parent_select ON public.registration_promo_redemptions
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY registration_promo_redemptions_deny_client_write ON public.registration_promo_redemptions
  FOR INSERT WITH CHECK (false);

ALTER TABLE public.registration_payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

ALTER TABLE public.registration_payments
  DROP CONSTRAINT IF EXISTS registration_payments_status_check;

ALTER TABLE public.registration_payments
  ADD CONSTRAINT registration_payments_status_check
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

CREATE OR REPLACE FUNCTION public.complete_checkout_registration(
  p_checkout_session_id TEXT,
  p_amount_paid_cents INTEGER,
  p_discount_cents INTEGER DEFAULT 0,
  p_platform_fee_cents INTEGER DEFAULT 0,
  p_payment_plan TEXT DEFAULT 'full',
  p_installment_number INTEGER DEFAULT 1,
  p_total_due_cents INTEGER DEFAULT NULL,
  p_promo_code_id UUID DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
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
  v_total_due INTEGER;
  v_new_paid INTEGER;
  v_fully_paid BOOLEAN;
  v_payment_status TEXT;
BEGIN
  SELECT * INTO v_registration
  FROM public.program_registrations
  WHERE stripe_checkout_session_id = p_checkout_session_id
    AND payment_status IN ('pending', 'partial')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_program FROM public.programs WHERE id = v_registration.program_id;

  v_total_due := COALESCE(p_total_due_cents, v_registration.total_due_cents, p_amount_paid_cents);
  v_new_paid := COALESCE(v_registration.amount_paid_cents, 0) + p_amount_paid_cents;
  v_fully_paid := v_new_paid >= v_total_due;

  IF p_payment_plan = 'installment' AND NOT v_fully_paid THEN
    v_payment_status := 'partial';
  ELSE
    v_payment_status := 'paid';
  END IF;

  UPDATE public.program_registrations
  SET
    payment_status = v_payment_status,
    amount_paid_cents = v_new_paid,
    paid_at = CASE WHEN v_fully_paid THEN v_now ELSE paid_at END,
    discount_cents = COALESCE(p_discount_cents, discount_cents),
    platform_fee_cents = COALESCE(p_platform_fee_cents, platform_fee_cents),
    payment_plan = COALESCE(p_payment_plan, payment_plan),
    installment_count = COALESCE(v_registration.installment_count, installment_count),
    installments_paid = COALESCE(installments_paid, 0) + 1,
    total_due_cents = v_total_due,
    promo_code_id = COALESCE(p_promo_code_id, promo_code_id),
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
    status = CASE
      WHEN v_fully_paid AND v_program.require_payment_before_approval THEN 'active'
      ELSE status
    END,
    approved_at = CASE
      WHEN v_fully_paid AND v_program.require_payment_before_approval AND approved_at IS NULL THEN v_now
      ELSE approved_at
    END,
    updated_at = v_now
  WHERE id = v_registration.id;

  INSERT INTO public.registration_payments (
    registration_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    amount_cents,
    currency,
    status,
    paid_at,
    installment_number,
    platform_fee_cents
  )
  VALUES (
    v_registration.id,
    p_checkout_session_id,
    p_stripe_payment_intent_id,
    p_amount_paid_cents,
    coalesce(v_program.currency, 'usd'),
    CASE WHEN v_fully_paid THEN 'paid' ELSE 'paid' END,
    v_now,
    p_installment_number,
    COALESCE(p_platform_fee_cents, 0)
  )
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING;

  IF p_promo_code_id IS NOT NULL AND p_discount_cents > 0 THEN
    INSERT INTO public.registration_promo_redemptions (
      promo_code_id, registration_id, parent_id, discount_cents
    )
    VALUES (
      p_promo_code_id,
      v_registration.id,
      v_registration.parent_id,
      p_discount_cents
    )
    ON CONFLICT (registration_id) DO NOTHING;

    UPDATE public.registration_promo_codes
    SET uses_count = uses_count + 1, updated_at = v_now
    WHERE id = p_promo_code_id;
  END IF;

  PERFORM public.log_registration_audit(
    v_registration.id,
    v_registration.parent_id,
    'payment_completed',
    jsonb_build_object(
      'amount_cents', p_amount_paid_cents,
      'discount_cents', p_discount_cents,
      'platform_fee_cents', p_platform_fee_cents,
      'payment_plan', p_payment_plan,
      'installment_number', p_installment_number,
      'fully_paid', v_fully_paid
    )
  );

  RETURN v_registration.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_registration_refund(
  p_registration_id UUID,
  p_actor_id UUID,
  p_refund_cents INTEGER,
  p_stripe_refund_id TEXT DEFAULT NULL,
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
  v_new_refund INTEGER;
BEGIN
  SELECT * INTO v_reg FROM public.program_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = v_reg.org_id
      AND om.user_id = p_actor_id
      AND om.role IN ('director', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_reg.amount_paid_cents IS NULL OR v_reg.amount_paid_cents <= 0 THEN
    RAISE EXCEPTION 'no_payment';
  END IF;

  v_new_refund := COALESCE(v_reg.refund_cents, 0) + p_refund_cents;
  IF v_new_refund > v_reg.amount_paid_cents THEN
    RAISE EXCEPTION 'refund_exceeds_paid';
  END IF;

  UPDATE public.program_registrations
  SET
    refund_cents = v_new_refund,
    payment_status = CASE
      WHEN v_new_refund >= COALESCE(amount_paid_cents, 0) THEN 'refunded'
      ELSE payment_status
    END,
    updated_at = v_now
  WHERE id = p_registration_id;

  UPDATE public.registration_payments rp
  SET
    refund_cents = rp.refund_cents + p_refund_cents,
    refunded_at = v_now,
    status = CASE
      WHEN rp.refund_cents + p_refund_cents >= rp.amount_cents THEN 'refunded'
      ELSE 'partially_refunded'
    END,
    stripe_refund_id = COALESCE(p_stripe_refund_id, rp.stripe_refund_id)
  WHERE rp.id = (
    SELECT id FROM public.registration_payments
    WHERE registration_id = p_registration_id
      AND stripe_payment_intent_id IS NOT NULL
    ORDER BY paid_at DESC NULLS LAST
    LIMIT 1
  );

  PERFORM public.log_registration_audit(
    p_registration_id,
    p_actor_id,
    'payment_refunded',
    jsonb_build_object(
      'refund_cents', p_refund_cents,
      'stripe_refund_id', p_stripe_refund_id,
      'reason', p_reason
    )
  );

  RETURN p_registration_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_registration_refund FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_registration_refund TO authenticated;

COMMENT ON TABLE public.registration_promo_codes IS 'Phase 44 promo / sibling codes for registration checkout';
COMMENT ON COLUMN public.program_registrations.payment_status IS 'partial = installment plan in progress';
