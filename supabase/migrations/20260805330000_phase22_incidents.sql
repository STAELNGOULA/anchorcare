-- Phase 22: Incident reporting

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('green', 'yellow', 'red')),
  is_red_flag BOOLEAN NOT NULL DEFAULT false,
  occurred_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  mechanism TEXT,
  body_area TEXT,
  symptoms TEXT,
  pain_level INT CHECK (pain_level IS NULL OR (pain_level >= 1 AND pain_level <= 10)),
  action_taken TEXT,
  witnesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'amended', 'closed')),
  parent_notified_at TIMESTAMPTZ,
  notification_staged_at TIMESTAMPTZ,
  notification_priority TEXT NOT NULL DEFAULT 'standard'
    CHECK (notification_priority IN ('standard', 'priority')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_org_occurred
  ON public.incidents (org_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_program_occurred
  ON public.incidents (program_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_child
  ON public.incidents (child_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_red_flag
  ON public.incidents (org_id, occurred_at DESC)
  WHERE is_red_flag = true;

CREATE INDEX IF NOT EXISTS idx_incident_audit_log_incident
  ON public.incident_audit_log (incident_id, created_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incidents_coach_insert ON public.incidents;
CREATE POLICY incidents_coach_insert ON public.incidents
  FOR INSERT
  WITH CHECK (
    reported_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.program_coaches pc
        WHERE pc.program_id = incidents.program_id
          AND pc.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.org_id = incidents.org_id
          AND om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS incidents_staff_select ON public.incidents;
CREATE POLICY incidents_staff_select ON public.incidents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = incidents.program_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = incidents.org_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS incidents_parent_select ON public.incidents;
CREATE POLICY incidents_parent_select ON public.incidents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = incidents.child_id
        AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS incident_audit_staff_select ON public.incident_audit_log;
CREATE POLICY incident_audit_staff_select ON public.incident_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.org_members om ON om.org_id = i.org_id
      WHERE i.id = incident_audit_log.incident_id
        AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.program_coaches pc ON pc.program_id = i.program_id
      WHERE i.id = incident_audit_log.incident_id
        AND pc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS incident_audit_insert ON public.incident_audit_log;
CREATE POLICY incident_audit_insert ON public.incident_audit_log
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS incident_photos_staff_all ON public.incident_photos;
CREATE POLICY incident_photos_staff_all ON public.incident_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.program_coaches pc ON pc.program_id = i.program_id
      WHERE i.id = incident_photos.incident_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.org_members om ON om.org_id = i.org_id
      WHERE i.id = incident_photos.incident_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (uploaded_by = auth.uid());

COMMENT ON TABLE public.incidents IS 'Phase 22 structured incident reports';
COMMENT ON TABLE public.incident_audit_log IS 'Immutable incident audit trail';
COMMENT ON TABLE public.incident_photos IS 'Phase 22 incident photo attachments';
