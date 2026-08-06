-- Phase 40–42: Shift handoff notes, morning health checks, roster view extension

CREATE TABLE IF NOT EXISTS public.handoff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  note TEXT NOT NULL CHECK (char_length(trim(note)) > 0 AND char_length(note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handoff_notes_org_shift_date
  ON public.handoff_notes (org_id, shift_date DESC);

CREATE INDEX IF NOT EXISTS idx_handoff_notes_program_shift_date
  ON public.handoff_notes (program_id, shift_date DESC);

ALTER TABLE public.handoff_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS handoff_notes_staff_select ON public.handoff_notes;
CREATE POLICY handoff_notes_staff_select ON public.handoff_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = handoff_notes.org_id
        AND om.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = handoff_notes.program_id
        AND pc.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS handoff_notes_staff_insert ON public.handoff_notes;
CREATE POLICY handoff_notes_staff_insert ON public.handoff_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = handoff_notes.org_id
        AND om.user_id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT ON public.handoff_notes TO authenticated;

COMMENT ON TABLE public.handoff_notes IS 'Phase 40 end-of-shift notes for next staff / morning dashboard';

CREATE TABLE IF NOT EXISTS public.morning_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  health_status TEXT NOT NULL CHECK (
    health_status IN ('healthy', 'mild_symptoms', 'staying_home')
  ),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_morning_health_org_date
  ON public.morning_health_checks (org_id, check_date DESC);

CREATE INDEX IF NOT EXISTS idx_morning_health_program_date
  ON public.morning_health_checks (program_id, check_date DESC)
  WHERE program_id IS NOT NULL;

ALTER TABLE public.morning_health_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS morning_health_parent_all ON public.morning_health_checks;
CREATE POLICY morning_health_parent_all ON public.morning_health_checks
  FOR ALL TO authenticated
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS morning_health_staff_select ON public.morning_health_checks;
CREATE POLICY morning_health_staff_select ON public.morning_health_checks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_registrations pr
      WHERE pr.child_id = morning_health_checks.child_id
        AND pr.status IN ('active', 'pending')
        AND (
          EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = (SELECT auth.uid()) AND om.org_id = pr.org_id
          )
          OR EXISTS (
            SELECT 1 FROM public.program_coaches pc
            WHERE pc.user_id = (SELECT auth.uid()) AND pc.program_id = pr.program_id
          )
        )
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.morning_health_checks TO authenticated;

COMMENT ON TABLE public.morning_health_checks IS 'Phase 41 parent morning health tap — expires end of calendar day';

-- Extend roster view: pickup ETA + morning health
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
      WHEN active_cs.share_status IN ('cleared', 'cleared_with_conditions') THEN 'cleared'
      WHEN active_cs.share_status = 'restricted' THEN 'hold'
      ELSE NULL
    END,
    CASE
      WHEN pr.status = 'active' THEN 'cleared'
      WHEN pr.status = 'pending' THEN 'pending'
      ELSE 'hold'
    END
  ) AS clearance_status,
  (po.id IS NOT NULL) AS pickup_override_today,
  po.person_name AS pickup_override_name,
  po.note AS pickup_override_note,
  po.until_time AS pickup_override_until,
  po.expires_at AS pickup_override_expires_at,
  (eta.id IS NOT NULL) AS pickup_eta_active,
  eta.minutes_late AS pickup_eta_minutes,
  eta.note AS pickup_eta_note,
  eta.expected_at AS pickup_eta_expected_at,
  hc.health_status AS morning_health_status,
  hc.note AS morning_health_note
FROM public.program_registrations pr
INNER JOIN public.children c ON c.id = pr.child_id
INNER JOIN public.programs p ON p.id = pr.program_id
LEFT JOIN public.roster_staff_notes rsn ON rsn.registration_id = pr.id
LEFT JOIN LATERAL (
  SELECT cs.share_status
  FROM public.clearance_shares cs
  WHERE cs.registration_id = pr.id
    AND cs.revoked_at IS NULL
    AND (cs.expires_at IS NULL OR cs.expires_at > NOW())
  ORDER BY cs.shared_at DESC
  LIMIT 1
) active_cs ON true
LEFT JOIN LATERAL (
  SELECT po2.id, po2.person_name, po2.note, po2.until_time, po2.expires_at
  FROM public.pickup_overrides po2
  WHERE po2.child_id = pr.child_id
    AND po2.expires_at > NOW()
  ORDER BY po2.expires_at DESC
  LIMIT 1
) po ON true
LEFT JOIN LATERAL (
  SELECT e.id, e.minutes_late, e.note, e.expected_at
  FROM public.pickup_eta_events e
  WHERE e.child_id = pr.child_id
    AND e.canceled_at IS NULL
    AND e.expected_at > NOW()
    AND e.valid_date = CURRENT_DATE
  ORDER BY e.expected_at DESC
  LIMIT 1
) eta ON true
LEFT JOIN LATERAL (
  SELECT m.health_status, m.note
  FROM public.morning_health_checks m
  WHERE m.child_id = pr.child_id
    AND m.check_date = CURRENT_DATE
  ORDER BY m.created_at DESC
  LIMIT 1
) hc ON true
WHERE pr.status IN ('active', 'pending');

COMMENT ON VIEW public.roster_entries IS 'Roster + pickup override + clearance + pickup ETA + morning health (Phase 41)';
