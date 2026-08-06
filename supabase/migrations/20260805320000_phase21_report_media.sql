-- Phase 21: Report media assets + child tags

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INT NOT NULL,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('uploading', 'ready', 'published', 'failed')),
  exif_stripped BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_child_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  report_child_id UUID REFERENCES public.report_children(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (media_asset_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_daily_report
  ON public.media_assets (daily_report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_assets_program_status
  ON public.media_assets (program_id, status);

CREATE INDEX IF NOT EXISTS idx_media_child_tags_child
  ON public.media_child_tags (child_id);

CREATE INDEX IF NOT EXISTS idx_media_child_tags_media
  ON public.media_child_tags (media_asset_id);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_child_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_assets_coach_all ON public.media_assets;
CREATE POLICY media_assets_coach_all ON public.media_assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = media_assets.program_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = media_assets.org_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.program_coaches pc
        WHERE pc.program_id = media_assets.program_id
          AND pc.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.org_id = media_assets.org_id
          AND om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS media_child_tags_coach_all ON public.media_child_tags;
CREATE POLICY media_child_tags_coach_all ON public.media_child_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.media_assets ma
      JOIN public.program_coaches pc ON pc.program_id = ma.program_id
      WHERE ma.id = media_child_tags.media_asset_id
        AND pc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.media_assets ma
      JOIN public.org_members om ON om.org_id = ma.org_id
      WHERE ma.id = media_child_tags.media_asset_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS media_assets_parent_select ON public.media_assets;
CREATE POLICY media_assets_parent_select ON public.media_assets
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.media_child_tags mct
      JOIN public.children c ON c.id = mct.child_id
      WHERE mct.media_asset_id = media_assets.id
        AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS media_child_tags_parent_select ON public.media_child_tags;
CREATE POLICY media_child_tags_parent_select ON public.media_child_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = media_child_tags.child_id
        AND c.parent_id = auth.uid()
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON TABLE public.media_assets IS 'Phase 21 coach report photos — manual child tags only';
COMMENT ON TABLE public.media_child_tags IS 'Phase 21 many-to-many child tags per media asset';
