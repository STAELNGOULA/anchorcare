-- Phase 10: Children profiles — emergency contacts, medications table, health fields, private photos

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS allergy_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS physician_name TEXT,
  ADD COLUMN IF NOT EXISTS physician_phone TEXT,
  ADD COLUMN IF NOT EXISTS insurance_info TEXT;

CREATE TABLE IF NOT EXISTS public.child_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_emergency_contacts_child_id
  ON public.child_emergency_contacts (child_id);
CREATE INDEX IF NOT EXISTS idx_child_emergency_contacts_parent_id
  ON public.child_emergency_contacts (parent_id);

ALTER TABLE public.child_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_emergency_contacts_parent_select ON public.child_emergency_contacts
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY child_emergency_contacts_parent_insert ON public.child_emergency_contacts
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY child_emergency_contacts_parent_update ON public.child_emergency_contacts
  FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY child_emergency_contacts_parent_delete ON public.child_emergency_contacts
  FOR DELETE USING (parent_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.child_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_medications_child_id
  ON public.child_medications (child_id);
CREATE INDEX IF NOT EXISTS idx_child_medications_parent_id
  ON public.child_medications (parent_id);

ALTER TABLE public.child_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_medications_parent_select ON public.child_medications
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY child_medications_parent_insert ON public.child_medications
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY child_medications_parent_update ON public.child_medications
  FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY child_medications_parent_delete ON public.child_medications
  FOR DELETE USING (parent_id = auth.uid());

-- Migrate legacy JSONB medications into normalized rows (one-time best effort)
INSERT INTO public.child_medications (child_id, parent_id, name, dose, schedule, sort_order)
SELECT
  c.id,
  c.parent_id,
  COALESCE(med->>'name', med->>'medication', 'Medication'),
  COALESCE(med->>'dose', ''),
  COALESCE(med->>'schedule', ''),
  (ord - 1)::INTEGER
FROM public.children c
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(c.medications) = 'array' THEN c.medications
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS t(med, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.child_medications cm WHERE cm.child_id = c.id
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-photos',
  'child-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY child_photos_parent_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY child_photos_parent_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'child-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY child_photos_parent_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY child_photos_parent_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
