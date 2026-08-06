-- Phase 13: Emergency card per-program consents + staff realtime bump

CREATE TABLE IF NOT EXISTS public.emergency_program_consents (
  registration_id UUID PRIMARY KEY REFERENCES public.program_registrations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_allergies BOOLEAN NOT NULL DEFAULT true,
  share_meds BOOLEAN NOT NULL DEFAULT true,
  share_contacts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_consents_child
  ON public.emergency_program_consents (child_id);

CREATE INDEX IF NOT EXISTS idx_emergency_consents_program
  ON public.emergency_program_consents (program_id);

CREATE INDEX IF NOT EXISTS idx_emergency_consents_parent
  ON public.emergency_program_consents (parent_id);

-- Backfill existing registrations
INSERT INTO public.emergency_program_consents (
  registration_id, child_id, program_id, org_id, parent_id
)
SELECT pr.id, pr.child_id, pr.program_id, pr.org_id, pr.parent_id
FROM public.program_registrations pr
WHERE pr.status IN ('active', 'pending')
ON CONFLICT (registration_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_emergency_consents()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.emergency_program_consents (
    registration_id, child_id, program_id, org_id, parent_id
  )
  VALUES (NEW.id, NEW.child_id, NEW.program_id, NEW.org_id, NEW.parent_id)
  ON CONFLICT (registration_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emergency_consents_on_registration ON public.program_registrations;
CREATE TRIGGER trg_emergency_consents_on_registration
  AFTER INSERT ON public.program_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_emergency_consents();

CREATE OR REPLACE FUNCTION public.bump_emergency_consents_for_child(p_child_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.emergency_program_consents
  SET updated_at = NOW()
  WHERE child_id = p_child_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_bump_emergency_consents_child()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.bump_emergency_consents_for_child(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_emergency_consents_on_child ON public.children;
CREATE TRIGGER trg_bump_emergency_consents_on_child
  AFTER UPDATE OF allergies, allergy_items, medical_conditions, physician_name, physician_phone
  ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bump_emergency_consents_child();

CREATE OR REPLACE FUNCTION public.trg_bump_emergency_consents_meds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.bump_emergency_consents_for_child(
    COALESCE(NEW.child_id, OLD.child_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_emergency_consents_on_meds ON public.child_medications;
CREATE TRIGGER trg_bump_emergency_consents_on_meds
  AFTER INSERT OR UPDATE OR DELETE ON public.child_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bump_emergency_consents_meds();

CREATE OR REPLACE FUNCTION public.trg_bump_emergency_consents_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.bump_emergency_consents_for_child(
    COALESCE(NEW.child_id, OLD.child_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_emergency_consents_on_contacts ON public.child_emergency_contacts;
CREATE TRIGGER trg_bump_emergency_consents_on_contacts
  AFTER INSERT OR UPDATE OR DELETE ON public.child_emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bump_emergency_consents_contacts();

ALTER TABLE public.emergency_program_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emergency_consents_parent_all ON public.emergency_program_consents;
CREATE POLICY emergency_consents_parent_all ON public.emergency_program_consents
  FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS emergency_consents_staff_select ON public.emergency_program_consents;
CREATE POLICY emergency_consents_staff_select ON public.emergency_program_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.program_registrations pr
      WHERE pr.id = emergency_program_consents.registration_id
        AND (
          EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid()
              AND om.org_id = pr.org_id
          )
          OR EXISTS (
            SELECT 1 FROM public.program_coaches pc
            WHERE pc.user_id = auth.uid()
              AND pc.program_id = pr.program_id
          )
        )
    )
  );

COMMENT ON TABLE public.emergency_program_consents IS 'Per-program emergency card sharing consents (Phase 13)';
