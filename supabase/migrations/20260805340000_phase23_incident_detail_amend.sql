-- Phase 23: Incident detail, amend window, immutable audit, parent read access

-- Parent can read audit trail for their child's incidents
DROP POLICY IF EXISTS incident_audit_parent_select ON public.incident_audit_log;
CREATE POLICY incident_audit_parent_select ON public.incident_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.children c ON c.id = i.child_id
      WHERE i.id = incident_audit_log.incident_id
        AND c.parent_id = auth.uid()
    )
  );

-- Parent can view incident photos
DROP POLICY IF EXISTS incident_photos_parent_select ON public.incident_photos;
CREATE POLICY incident_photos_parent_select ON public.incident_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.children c ON c.id = i.child_id
      WHERE i.id = incident_photos.incident_id
        AND c.parent_id = auth.uid()
    )
  );

-- Directors may amend incidents within application-enforced 24h window
DROP POLICY IF EXISTS incidents_director_update ON public.incidents;
CREATE POLICY incidents_director_update ON public.incidents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = incidents.org_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = incidents.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Immutable audit log — append only
CREATE OR REPLACE FUNCTION public.prevent_incident_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'incident_audit_log is immutable';
END;
$$;

DROP TRIGGER IF EXISTS incident_audit_log_immutable ON public.incident_audit_log;
CREATE TRIGGER incident_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.incident_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_incident_audit_mutation();

COMMENT ON FUNCTION public.prevent_incident_audit_mutation IS 'Phase 23 — incident audit trail append-only';
