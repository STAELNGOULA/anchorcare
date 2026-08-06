-- Phase 29: Platform subscriptions (parent Family + business Pro) + webhook idempotency

DO $$ BEGIN
  CREATE TYPE public.subscription_sku AS ENUM ('parent_family', 'business_pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku public.subscription_sku NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('parent', 'organization')),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_owner_xor CHECK (
    (owner_type = 'parent' AND parent_id IS NOT NULL AND org_id IS NULL)
    OR (owner_type = 'organization' AND org_id IS NOT NULL AND parent_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_parent_sku
  ON public.subscriptions (parent_id, sku)
  WHERE parent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_org_sku
  ON public.subscriptions (org_id, sku)
  WHERE org_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type
  ON public.stripe_webhook_events (event_type, processed_at DESC);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_parent_select ON public.subscriptions;
CREATE POLICY subscriptions_parent_select ON public.subscriptions
  FOR SELECT TO authenticated
  USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS subscriptions_org_director_select ON public.subscriptions;
CREATE POLICY subscriptions_org_director_select ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT p.org_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'business_admin'
    )
  );

GRANT SELECT ON public.subscriptions TO authenticated;

COMMENT ON TABLE public.subscriptions IS 'ANCHOR platform SKUs mirrored from Stripe (Phase 29)';
COMMENT ON TABLE public.stripe_webhook_events IS 'Idempotent Stripe webhook processing (Phase 29)';
