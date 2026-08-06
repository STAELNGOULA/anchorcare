-- Phase 12: Roster entries view + staff notes

CREATE TABLE IF NOT EXISTS public.roster_staff_notes (
  registration_id UUID PRIMARY KEY REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_name TEXT,
  staff_notes TEXT,
  clearance_override TEXT CHECK (
    clearance_override IS NULL
    OR clearance_override IN ('cleared', 'pending', 'hold')
  ),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roster_staff_notes_org
  ON public.roster_staff_notes (org_id);

ALTER TABLE public.roster_staff_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roster_staff_notes_deny ON public.roster_staff_notes;
CREATE POLICY roster_staff_notes_deny ON public.roster_staff_notes
  FOR ALL USING (false);

CREATE OR REPLACE VIEW public.roster_entries
WITH (security_invoker = true)
AS
SELECT
  pr.id AS registration_id,
  pr.org_id,
  pr.program_id,
  pr.child_id,
  pr.parent_id,
  pr.status AS registration_status,
  pr.created_at AS enrolled_at,
  c.first_name,
  c.last_name,
  c.date_of_birth,
  c.photo_url,
  c.allergies,
  c.allergy_items,
  c.medical_conditions,
  c.medications,
  c.physician_name,
  c.physician_phone,
  c.insurance_info,
  p.name AS program_name,
  p.program_slug,
  rsn.group_name,
  rsn.staff_notes,
  rsn.clearance_override,
  COALESCE(
    rsn.clearance_override,
    CASE
      WHEN pr.status = 'active' THEN 'cleared'
      WHEN pr.status = 'pending' THEN 'pending'
      ELSE 'hold'
    END
  ) AS clearance_status,
  false AS pickup_override_today
FROM public.program_registrations pr
INNER JOIN public.children c ON c.id = pr.child_id
INNER JOIN public.programs p ON p.id = pr.program_id
LEFT JOIN public.roster_staff_notes rsn ON rsn.registration_id = pr.id
WHERE pr.status IN ('active', 'pending');

COMMENT ON VIEW public.roster_entries IS 'Phase 12 roster — active/pending registrations with child + program fields';
