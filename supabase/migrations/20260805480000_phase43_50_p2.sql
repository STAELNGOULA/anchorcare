-- Phases 43–50: discovery geo, marketplace, revenue, rollover, SMS inbound, compliance export, referrals

-- Phase 43: discovery geo index
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_organizations_discovery_city
  ON public.organizations (city, region)
  WHERE public_page_enabled = true;

-- Phase 45: Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 120),
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  image_path TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_org_active
  ON public.marketplace_products (org_id, active);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT UNIQUE,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_parent
  ON public.marketplace_orders (parent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 20),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_products_staff_select ON public.marketplace_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = marketplace_products.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('director', 'staff')
    )
  );

CREATE POLICY marketplace_products_director_write ON public.marketplace_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = marketplace_products.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = marketplace_products.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  );

CREATE POLICY marketplace_products_parent_select ON public.marketplace_products
  FOR SELECT USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.program_registrations pr
      WHERE pr.org_id = marketplace_products.org_id
        AND pr.parent_id = auth.uid()
        AND pr.status = 'active'
    )
  );

CREATE POLICY marketplace_orders_parent_select ON public.marketplace_orders
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY marketplace_orders_deny_client_write ON public.marketplace_orders
  FOR INSERT WITH CHECK (false);

CREATE POLICY marketplace_order_items_parent_select ON public.marketplace_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      WHERE o.id = marketplace_order_items.order_id
        AND o.parent_id = auth.uid()
    )
  );

-- Phase 47: season rollover audit
CREATE TABLE IF NOT EXISTS public.program_season_rollovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  new_program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  invites_sent INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.program_season_rollovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY program_season_rollovers_director ON public.program_season_rollovers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = program_season_rollovers.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  );

-- Phase 48: SMS inbound + parent phone
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS public.sms_inbound_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE SET NULL,
  from_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  twilio_message_sid TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'processed'
    CHECK (status IN ('processed', 'rejected', 'rate_limited', 'unknown_sender')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_inbound_parent_day
  ON public.sms_inbound_log (parent_id, created_at DESC);

ALTER TABLE public.sms_inbound_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY sms_inbound_log_deny_client ON public.sms_inbound_log
  FOR ALL USING (false);

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
    CHECK (message_type IN ('text', 'broadcast', 'system', 'sms'));

-- Phase 49: compliance bulk export
CREATE TABLE IF NOT EXISTS public.compliance_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'zip')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  storage_path TEXT,
  expires_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compliance_exports_date_range CHECK (end_date >= start_date)
);

ALTER TABLE public.compliance_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_exports_director ON public.compliance_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = compliance_exports.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  );

CREATE POLICY compliance_exports_director_insert ON public.compliance_exports
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = compliance_exports.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'director'
    )
  );

-- Phase 50: Referrals
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_referral_code
  ON public.organizations (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_type TEXT NOT NULL CHECK (referrer_type IN ('parent', 'business')),
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (reward_status IN ('pending', 'granted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_attributions_unique_referred UNIQUE (referred_user_id)
);

ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_attributions_self_select ON public.referral_attributions
  FOR SELECT USING (
    referred_user_id = auth.uid()
    OR referrer_id = auth.uid()
  );

CREATE POLICY referral_attributions_deny_client_write ON public.referral_attributions
  FOR INSERT WITH CHECK (false);

-- Phase 46: revenue stats RPC
CREATE OR REPLACE FUNCTION public.org_revenue_stats(
  p_org_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_days INTEGER := LEAST(90, GREATEST(7, p_days));
  v_gross INTEGER := 0;
  v_fees INTEGER := 0;
  v_refunds INTEGER := 0;
  v_by_program JSONB := '[]'::JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = p_org_id
      AND om.user_id = v_user_id
      AND om.role IN ('director', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT
    COALESCE(SUM(rp.amount_cents), 0)::INTEGER,
    COALESCE(SUM(rp.platform_fee_cents), 0)::INTEGER,
    COALESCE(SUM(rp.refund_cents), 0)::INTEGER
  INTO v_gross, v_fees, v_refunds
  FROM public.registration_payments rp
  INNER JOIN public.program_registrations pr ON pr.id = rp.registration_id
  WHERE pr.org_id = p_org_id
    AND rp.status IN ('paid', 'partially_refunded')
    AND rp.paid_at >= NOW() - (v_days || ' days')::INTERVAL;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'program_id', p.id,
      'program_name', p.name,
      'gross_cents', COALESCE(s.gross, 0),
      'fee_cents', COALESCE(s.fees, 0),
      'refund_cents', COALESCE(s.refunds, 0)
    )
    ORDER BY COALESCE(s.gross, 0) DESC
  ), '[]'::JSONB)
  INTO v_by_program
  FROM public.programs p
  LEFT JOIN (
    SELECT
      pr.program_id,
      SUM(rp.amount_cents)::INTEGER AS gross,
      SUM(rp.platform_fee_cents)::INTEGER AS fees,
      SUM(rp.refund_cents)::INTEGER AS refunds
    FROM public.registration_payments rp
    INNER JOIN public.program_registrations pr ON pr.id = rp.registration_id
    WHERE pr.org_id = p_org_id
      AND rp.status IN ('paid', 'partially_refunded')
      AND rp.paid_at >= NOW() - (v_days || ' days')::INTERVAL
    GROUP BY pr.program_id
  ) s ON s.program_id = p.id
  WHERE p.org_id = p_org_id;

  RETURN jsonb_build_object(
    'days', v_days,
    'gross_cents', v_gross,
    'platform_fee_cents', v_fees,
    'refund_cents', v_refunds,
    'net_cents', v_gross - v_fees - v_refunds,
    'by_program', v_by_program
  );
END;
$$;

REVOKE ALL ON FUNCTION public.org_revenue_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.org_revenue_stats TO authenticated;

-- Marketplace order completion
CREATE OR REPLACE FUNCTION public.complete_marketplace_order(
  p_checkout_session_id TEXT,
  p_amount_paid_cents INTEGER,
  p_platform_fee_cents INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE stripe_checkout_session_id = p_checkout_session_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE public.marketplace_orders
  SET
    status = 'paid',
    platform_fee_cents = COALESCE(p_platform_fee_cents, platform_fee_cents),
    paid_at = v_now,
    updated_at = v_now
  WHERE id = v_order.id;

  RETURN v_order.id;
END;
$$;

COMMENT ON TABLE public.marketplace_products IS 'Phase 45 marketplace shop listings';
COMMENT ON TABLE public.compliance_exports IS 'Phase 49 bulk compliance export jobs';
COMMENT ON TABLE public.referral_attributions IS 'Phase 50 referral program attributions';
