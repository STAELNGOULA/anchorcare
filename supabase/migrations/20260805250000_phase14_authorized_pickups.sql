-- Phase 14: Authorized pickups + today overrides

CREATE TABLE IF NOT EXISTS public.authorized_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authorized_pickups_child
  ON public.authorized_pickups (child_id);

CREATE INDEX IF NOT EXISTS idx_authorized_pickups_parent
  ON public.authorized_pickups (parent_id);

CREATE TABLE IF NOT EXISTS public.pickup_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authorized_pickup_id UUID REFERENCES public.authorized_pickups(id) ON DELETE SET NULL,
  person_name TEXT NOT NULL,
  note TEXT,
  valid_date DATE NOT NULL,
  until_time TIME,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, valid_date)
);

CREATE INDEX IF NOT EXISTS idx_pickup_overrides_child_valid_date
  ON public.pickup_overrides (child_id, valid_date);

CREATE INDEX IF NOT EXISTS idx_pickup_overrides_expires
  ON public.pickup_overrides (expires_at);

CREATE OR REPLACE FUNCTION public.set_pickup_override_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.until_time IS NOT NULL THEN
    NEW.expires_at :=
      (NEW.valid_date + NEW.until_time)::timestamp AT TIME ZONE NEW.timezone;
  ELSE
    NEW.expires_at :=
      ((NEW.valid_date + INTERVAL '1 day')::timestamp AT TIME ZONE NEW.timezone);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pickup_override_expires ON public.pickup_overrides;
CREATE TRIGGER trg_pickup_override_expires
  BEFORE INSERT OR UPDATE ON public.pickup_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_pickup_override_expires_at();

ALTER TABLE public.authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authorized_pickups_parent_all ON public.authorized_pickups;
CREATE POLICY authorized_pickups_parent_all ON public.authorized_pickups
  FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS authorized_pickups_staff_select ON public.authorized_pickups;
CREATE POLICY authorized_pickups_staff_select ON public.authorized_pickups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_registrations pr
      WHERE pr.child_id = authorized_pickups.child_id
        AND pr.status IN ('active', 'pending')
        AND (
          EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid() AND om.org_id = pr.org_id
          )
          OR EXISTS (
            SELECT 1 FROM public.program_coaches pc
            WHERE pc.user_id = auth.uid() AND pc.program_id = pr.program_id
          )
        )
    )
  );

DROP POLICY IF EXISTS pickup_overrides_parent_all ON public.pickup_overrides;
CREATE POLICY pickup_overrides_parent_all ON public.pickup_overrides
  FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS pickup_overrides_staff_select ON public.pickup_overrides;
CREATE POLICY pickup_overrides_staff_select ON public.pickup_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_registrations pr
      WHERE pr.child_id = pickup_overrides.child_id
        AND pr.status IN ('active', 'pending')
        AND (
          EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid() AND om.org_id = pr.org_id
          )
          OR EXISTS (
            SELECT 1 FROM public.program_coaches pc
            WHERE pc.user_id = auth.uid() AND pc.program_id = pr.program_id
          )
        )
    )
  );

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
  SELECT po2.id, po2.person_name, po2.note, po2.until_time, po2.expires_at
  FROM public.pickup_overrides po2
  WHERE po2.child_id = pr.child_id
    AND po2.expires_at > NOW()
  ORDER BY po2.expires_at DESC
  LIMIT 1
) po ON true
WHERE pr.status IN ('active', 'pending');

COMMENT ON VIEW public.roster_entries IS 'Phase 12 roster + Phase 14 pickup overrides';
