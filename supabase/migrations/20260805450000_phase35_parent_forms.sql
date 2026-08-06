-- Phase 35: Parent forms vault

CREATE TABLE IF NOT EXISTS public.parent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  form_type TEXT NOT NULL
    CHECK (form_type IN ('immunization', 'physical', 'permission', 'custom')),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_mime TEXT,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_forms_parent
  ON public.parent_forms (parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parent_forms_expiry
  ON public.parent_forms (parent_id, expires_at)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.parent_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_forms_owner_all ON public.parent_forms;
CREATE POLICY parent_forms_owner_all ON public.parent_forms
  FOR ALL TO authenticated
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_forms TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parent-forms',
  'parent-forms',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS parent_forms_storage_parent ON storage.objects;
CREATE POLICY parent_forms_storage_parent ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'parent-forms'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'parent-forms'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

COMMENT ON TABLE public.parent_forms IS 'Phase 35 parent forms vault with optional expiry';
