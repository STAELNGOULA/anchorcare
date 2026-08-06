-- Phase 16: Per-child report drafts, timeline events, publish audit

ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS publish_idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reports_publish_idempotency
  ON public.daily_reports (publish_idempotency_key)
  WHERE publish_idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.report_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.program_registrations(id) ON DELETE SET NULL,
  mentioned_name TEXT,
  ai_draft_text TEXT,
  draft_text TEXT,
  published_text TEXT,
  transcript TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'skipped', 'published', 'flagged')),
  skipped_reason TEXT,
  misassigned_flag BOOLEAN NOT NULL DEFAULT false,
  photo_count INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_children_child_or_mention CHECK (
    child_id IS NOT NULL OR mentioned_name IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_children_report_child
  ON public.report_children (daily_report_id, child_id)
  WHERE child_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_children_orphan_name
  ON public.report_children (daily_report_id, lower(mentioned_name))
  WHERE child_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_children_daily_report
  ON public.report_children (daily_report_id);

ALTER TABLE public.report_children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_children_coach_select ON public.report_children;
CREATE POLICY report_children_coach_select ON public.report_children
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_reports dr
      JOIN public.program_coaches pc ON pc.program_id = dr.program_id
      WHERE dr.id = report_children.daily_report_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.daily_reports dr
      JOIN public.org_members om ON om.org_id = dr.org_id
      WHERE dr.id = report_children.daily_report_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS report_children_coach_write ON public.report_children;
CREATE POLICY report_children_coach_write ON public.report_children
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_reports dr
      JOIN public.program_coaches pc ON pc.program_id = dr.program_id
      WHERE dr.id = report_children.daily_report_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.daily_reports dr
      JOIN public.org_members om ON om.org_id = dr.org_id
      WHERE dr.id = report_children.daily_report_id
        AND om.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  daily_report_id UUID REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  report_child_id UUID REFERENCES public.report_children(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('daily_report', 'photo', 'incident', 'registration', 'note')),
  title TEXT NOT NULL,
  summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_child_occurred
  ON public.timeline_events (child_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_events_daily_report
  ON public.timeline_events (daily_report_id)
  WHERE daily_report_id IS NOT NULL;

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS timeline_events_parent_select ON public.timeline_events;
CREATE POLICY timeline_events_parent_select ON public.timeline_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = timeline_events.child_id
        AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS timeline_events_staff_select ON public.timeline_events;
CREATE POLICY timeline_events_staff_select ON public.timeline_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = timeline_events.org_id
        AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = timeline_events.program_id
        AND pc.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.report_children IS 'Phase 16 per-child AI drafts from daily voice reports';
COMMENT ON TABLE public.timeline_events IS 'Phase 16+ parent timeline feed events';
