-- Phase 31: Visit reports vault + timeline sync + private PDF storage

CREATE TABLE IF NOT EXISTS public.visit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  summary TEXT NOT NULL,
  pdf_storage_path TEXT,
  timeline_event_id UUID,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_reports_child_date
  ON public.visit_reports (child_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_visit_reports_parent_date
  ON public.visit_reports (parent_id, appointment_date DESC);

ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visit_reports_parent_select ON public.visit_reports;
CREATE POLICY visit_reports_parent_select ON public.visit_reports
  FOR SELECT TO authenticated
  USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS visit_reports_admin_all ON public.visit_reports;
CREATE POLICY visit_reports_admin_all ON public.visit_reports
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

GRANT SELECT ON public.visit_reports TO authenticated;
GRANT ALL ON public.visit_reports TO authenticated;

-- Extend timeline for visit reports (P-13 / P-20)
ALTER TABLE public.timeline_events
  DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;

ALTER TABLE public.timeline_events
  ADD CONSTRAINT timeline_events_event_type_check
  CHECK (event_type IN (
    'daily_report',
    'photo',
    'incident',
    'registration',
    'note',
    'visit_report'
  ));

CREATE INDEX IF NOT EXISTS idx_timeline_events_child_visit_reports
  ON public.timeline_events (child_id, occurred_at DESC)
  WHERE event_type = 'visit_report';

ALTER TABLE public.visit_reports
  ADD CONSTRAINT visit_reports_timeline_event_fk
  FOREIGN KEY (timeline_event_id)
  REFERENCES public.timeline_events(id)
  ON DELETE SET NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-reports',
  'visit-reports',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.visit_reports IS 'Phase 31 parent visit vault — PDF + structured summary';
