-- Phase 30: Doctor directory + admin audit + booking_click engagement

CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  specialty TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}'::text[],
  country TEXT NOT NULL CHECK (country IN ('US', 'CA')),
  region TEXT,
  booking_url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_doctors_region_specialty
  ON public.doctors (region, specialty)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_doctors_country_active_sort
  ON public.doctors (country, is_active, sort_order DESC, display_name);

CREATE TABLE IF NOT EXISTS public.doctor_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL
    CHECK (action IN ('create', 'update', 'deactivate', 'reactivate')),
  before_state JSONB,
  after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_audit_doctor_created
  ON public.doctor_audit_log (doctor_id, created_at DESC);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctors_active_select ON public.doctors;
CREATE POLICY doctors_active_select ON public.doctors
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS doctors_admin_all ON public.doctors;
CREATE POLICY doctors_admin_all ON public.doctors
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

DROP POLICY IF EXISTS doctor_audit_admin_select ON public.doctor_audit_log;
CREATE POLICY doctor_audit_admin_select ON public.doctor_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

GRANT SELECT ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO authenticated;
GRANT SELECT ON public.doctor_audit_log TO authenticated;

-- Extend engagement events for doctor booking analytics (P-12)
ALTER TABLE public.parent_engagement_events
  DROP CONSTRAINT IF EXISTS parent_engagement_events_event_type_check;

ALTER TABLE public.parent_engagement_events
  ADD CONSTRAINT parent_engagement_events_event_type_check
  CHECK (event_type IN ('today_visit', 'report_open', 'report_read', 'booking_click'));

COMMENT ON TABLE public.doctors IS 'Phase 30 care directory — JANE / provider booking partners';
COMMENT ON TABLE public.doctor_audit_log IS 'Phase 30 admin CRUD audit trail for doctors';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doctor-photos',
  'doctor-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;
