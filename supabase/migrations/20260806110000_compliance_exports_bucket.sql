-- Compliance export CSV storage (Phase 49 follow-up)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-exports',
  'compliance-exports',
  false,
  52428800,
  ARRAY['text/csv', 'application/zip']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS compliance_exports_director_select ON storage.objects;
CREATE POLICY compliance_exports_director_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'compliance-exports'
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.role = 'director'
        AND om.org_id = ((storage.foldername(name))[1])::uuid
    )
  );

COMMENT ON POLICY compliance_exports_director_select ON storage.objects IS
  'Directors may read compliance export files for their organization folder';
