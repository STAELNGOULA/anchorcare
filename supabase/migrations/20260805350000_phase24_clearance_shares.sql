-- Phase 24: Parent clearance shares (summary only — no clinical notes)

CREATE TABLE IF NOT EXISTS public.clearance_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  share_status TEXT NOT NULL CHECK (
    share_status IN ('cleared', 'restricted', 'cleared_with_conditions')
  ),
  summary TEXT NOT NULL CHECK (char_length(summary) <= 500),
  conditions TEXT CHECK (conditions IS NULL OR char_length(conditions) <= 300),
  expires_at TIMESTAMPTZ,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clearance_shares_registration_shared
  ON public.clearance_shares (registration_id, shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_clearance_shares_child
  ON public.clearance_shares (child_id, shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_clearance_shares_active
  ON public.clearance_shares (registration_id, shared_at DESC)
  WHERE revoked_at IS NULL;

ALTER TABLE public.clearance_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clearance_shares_parent_insert ON public.clearance_shares;
CREATE POLICY clearance_shares_parent_insert ON public.clearance_shares
  FOR INSERT
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = clearance_shares.child_id
        AND c.parent_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.program_registrations pr
      WHERE pr.id = clearance_shares.registration_id
        AND pr.child_id = clearance_shares.child_id
        AND pr.parent_id = auth.uid()
        AND pr.status = 'active'
    )
  );

DROP POLICY IF EXISTS clearance_shares_parent_select ON public.clearance_shares;
CREATE POLICY clearance_shares_parent_select ON public.clearance_shares
  FOR SELECT
  USING (
    parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = clearance_shares.org_id
        AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = clearance_shares.program_id
        AND pc.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.clearance_shares IS 'Phase 24 parent-shared return-to-play summaries (no clinical notes)';

-- Roster view: badge reflects latest active clearance share
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
  po.expires_at AS pickup_override_expires_at
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
WHERE pr.status IN ('active', 'pending');

COMMENT ON VIEW public.roster_entries IS 'Phase 12 roster + Phase 14 pickup + Phase 24 clearance shares';
