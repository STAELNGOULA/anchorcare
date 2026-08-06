-- Phase 34: Running late pickup ETA

CREATE TABLE IF NOT EXISTS public.pickup_eta_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  minutes_late INT NOT NULL CHECK (minutes_late > 0 AND minutes_late <= 240),
  note TEXT,
  expected_at TIMESTAMPTZ NOT NULL,
  valid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pickup_eta_active_child_day
  ON public.pickup_eta_events (child_id, valid_date)
  WHERE canceled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pickup_eta_org_expected
  ON public.pickup_eta_events (org_id, expected_at)
  WHERE canceled_at IS NULL;

ALTER TABLE public.pickup_eta_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pickup_eta_parent_all ON public.pickup_eta_events;
CREATE POLICY pickup_eta_parent_all ON public.pickup_eta_events
  FOR ALL TO authenticated
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS pickup_eta_staff_select ON public.pickup_eta_events;
CREATE POLICY pickup_eta_staff_select ON public.pickup_eta_events
  FOR SELECT TO authenticated
  USING (
    canceled_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.program_registrations pr
      WHERE pr.child_id = pickup_eta_events.child_id
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

GRANT SELECT, INSERT, UPDATE ON public.pickup_eta_events TO authenticated;

-- Extend roster view with running-late ETA
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
  eta.expected_at AS pickup_eta_expected_at
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
WHERE pr.status IN ('active', 'pending');

COMMENT ON VIEW public.roster_entries IS 'Phase 12 roster + pickup override + clearance + Phase 34 pickup ETA';
