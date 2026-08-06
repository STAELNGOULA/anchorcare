-- Phase 37–39: Incident PDF exports, digest settings, send log

-- Incident insurance PDF exports (Phase 38)
CREATE TABLE IF NOT EXISTS public.incident_pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  expires_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_pdf_exports_incident
  ON public.incident_pdf_exports (incident_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_pdf_exports_org
  ON public.incident_pdf_exports (org_id, created_at DESC);

ALTER TABLE public.incident_pdf_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incident_pdf_exports_director_select ON public.incident_pdf_exports;
CREATE POLICY incident_pdf_exports_director_select ON public.incident_pdf_exports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = incident_pdf_exports.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
    )
  );

DROP POLICY IF EXISTS incident_pdf_exports_director_insert ON public.incident_pdf_exports;
CREATE POLICY incident_pdf_exports_director_insert ON public.incident_pdf_exports
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = incident_pdf_exports.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
    )
  );

GRANT SELECT, INSERT ON public.incident_pdf_exports TO authenticated;

COMMENT ON TABLE public.incident_pdf_exports IS 'Phase 38 insurance incident PDF async exports';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-exports',
  'incident-exports',
  false,
  20971520,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Business + coach digest settings (Phase 39)
CREATE TABLE IF NOT EXISTS public.org_digest_settings (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  business_enabled BOOLEAN NOT NULL DEFAULT true,
  business_delivery_day SMALLINT NOT NULL DEFAULT 1
    CHECK (business_delivery_day >= 0 AND business_delivery_day <= 6),
  business_recipient_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  coach_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.org_digest_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_digest_settings_director_select ON public.org_digest_settings;
CREATE POLICY org_digest_settings_director_select ON public.org_digest_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_digest_settings.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
    )
  );

DROP POLICY IF EXISTS org_digest_settings_director_upsert ON public.org_digest_settings;
CREATE POLICY org_digest_settings_director_upsert ON public.org_digest_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_digest_settings.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_digest_settings.org_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.org_digest_settings TO authenticated;

COMMENT ON TABLE public.org_digest_settings IS 'Phase 39 business weekly digest configuration';

CREATE TABLE IF NOT EXISTS public.coach_digest_preferences (
  coach_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coach_digest_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_digest_prefs_self ON public.coach_digest_preferences;
CREATE POLICY coach_digest_prefs_self ON public.coach_digest_preferences
  FOR ALL TO authenticated
  USING (coach_id = (SELECT auth.uid()))
  WITH CHECK (coach_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.coach_digest_preferences TO authenticated;

COMMENT ON TABLE public.coach_digest_preferences IS 'Phase 39 coach weekly digest opt-in';

CREATE TABLE IF NOT EXISTS public.digest_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_type TEXT NOT NULL CHECK (digest_type IN ('parent', 'business', 'coach')),
  recipient_id UUID NOT NULL,
  period_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (digest_type, recipient_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_digest_send_log_period
  ON public.digest_send_log (digest_type, period_key DESC);

ALTER TABLE public.digest_send_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.digest_send_log IS 'Phase 39 digest idempotency log (service role only)';
