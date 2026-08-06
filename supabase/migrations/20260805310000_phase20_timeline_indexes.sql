-- Phase 20: Timeline partial indexes for filtered parent feeds

CREATE INDEX IF NOT EXISTS idx_timeline_events_child_reports
  ON public.timeline_events (child_id, occurred_at DESC)
  WHERE event_type = 'daily_report';

CREATE INDEX IF NOT EXISTS idx_timeline_events_child_photos
  ON public.timeline_events (child_id, occurred_at DESC)
  WHERE event_type = 'photo';

CREATE INDEX IF NOT EXISTS idx_timeline_events_child_incidents
  ON public.timeline_events (child_id, occurred_at DESC)
  WHERE event_type = 'incident';

CREATE INDEX IF NOT EXISTS idx_timeline_events_child_care
  ON public.timeline_events (child_id, occurred_at DESC)
  WHERE event_type IN ('note', 'registration');
