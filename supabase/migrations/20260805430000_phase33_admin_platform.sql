-- Phase 33: Admin platform — audit log, slug disputes, moderation support

DO $$ BEGIN
  CREATE TYPE public.slug_dispute_status AS ENUM ('open', 'resolved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_created
  ON public.admin_audit_log (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log (target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.slug_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  disputed_slug TEXT NOT NULL,
  holder_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status public.slug_dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  granted_slug TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slug_disputes_slug_format CHECK (disputed_slug ~ '^[a-z0-9-]{3,40}$')
);

CREATE INDEX IF NOT EXISTS idx_slug_disputes_status_created
  ON public.slug_disputes (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_slug_disputes_slug
  ON public.slug_disputes (disputed_slug)
  WHERE status = 'open';

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_log_admin_select ON public.admin_audit_log;
CREATE POLICY admin_audit_log_admin_select ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS slug_disputes_admin_all ON public.slug_disputes;
CREATE POLICY slug_disputes_admin_all ON public.slug_disputes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS slug_disputes_director_insert ON public.slug_disputes;
CREATE POLICY slug_disputes_director_insert ON public.slug_disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = slug_disputes.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
        AND om.deactivated_at IS NULL
    )
  );

DROP POLICY IF EXISTS slug_disputes_director_select ON public.slug_disputes;
CREATE POLICY slug_disputes_director_select ON public.slug_disputes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = slug_disputes.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.deactivated_at IS NULL
    )
  );

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.slug_disputes TO authenticated;

COMMENT ON TABLE public.admin_audit_log IS 'Phase 33 admin support actions audit trail';
COMMENT ON TABLE public.slug_disputes IS 'Phase 33 public slug dispute queue for P8 support';
