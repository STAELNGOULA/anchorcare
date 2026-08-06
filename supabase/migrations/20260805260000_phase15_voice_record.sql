-- Phase 15: Daily report voice drafts + audio storage

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'transcribing', 'review', 'published', 'failed')),
  scope TEXT NOT NULL DEFAULT 'group'
    CHECK (scope IN ('group', 'per_child')),
  audio_path TEXT,
  audio_duration_ms INT,
  audio_mime_type TEXT,
  transcript TEXT,
  upload_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (upload_status IN ('pending', 'uploading', 'uploaded', 'failed')),
  upload_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_program_date
  ON public.daily_reports (program_id, report_date);

CREATE INDEX IF NOT EXISTS idx_daily_reports_recorded_by
  ON public.daily_reports (recorded_by);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_reports_coach_select ON public.daily_reports;
CREATE POLICY daily_reports_coach_select ON public.daily_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = daily_reports.program_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = daily_reports.org_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS daily_reports_coach_insert ON public.daily_reports;
CREATE POLICY daily_reports_coach_insert ON public.daily_reports
  FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.program_coaches pc
        WHERE pc.program_id = daily_reports.program_id
          AND pc.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.org_id = daily_reports.org_id
          AND om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS daily_reports_coach_update ON public.daily_reports;
CREATE POLICY daily_reports_coach_update ON public.daily_reports
  FOR UPDATE
  USING (
    recorded_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.program_coaches pc
        WHERE pc.program_id = daily_reports.program_id
          AND pc.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.org_id = daily_reports.org_id
          AND om.user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.daily_reports IS 'Phase 15 voice report drafts — one per program per day';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  false,
  52428800,
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
