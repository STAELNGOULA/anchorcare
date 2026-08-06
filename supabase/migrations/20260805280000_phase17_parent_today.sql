-- Phase 17: Parent Today engagement + WAPOR measurement

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_today_visit_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.parent_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('today_visit', 'report_open', 'report_read')),
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  timeline_event_id UUID REFERENCES public.timeline_events(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_engagement_parent_created
  ON public.parent_engagement_events (parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parent_engagement_wapor
  ON public.parent_engagement_events (parent_id, event_type, created_at DESC)
  WHERE event_type IN ('report_open', 'report_read');

ALTER TABLE public.parent_engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_engagement_select ON public.parent_engagement_events;
CREATE POLICY parent_engagement_select ON public.parent_engagement_events
  FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS parent_engagement_insert ON public.parent_engagement_events;
CREATE POLICY parent_engagement_insert ON public.parent_engagement_events
  FOR INSERT
  WITH CHECK (parent_id = auth.uid());

COMMENT ON TABLE public.parent_engagement_events IS 'Phase 17 WAPOR + parent Today engagement telemetry';
