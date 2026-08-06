-- Phase 28: Parent program consents (photos) + notification preferences

ALTER TABLE public.emergency_program_consents
  ADD COLUMN IF NOT EXISTS share_photos BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.parent_notification_preferences (
  parent_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  email_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME NOT NULL DEFAULT '21:00',
  quiet_hours_end TIME NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_notification_prefs_updated
  ON public.parent_notification_preferences (updated_at DESC);

ALTER TABLE public.parent_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_notification_prefs_select ON public.parent_notification_preferences;
CREATE POLICY parent_notification_prefs_select ON public.parent_notification_preferences
  FOR SELECT TO authenticated
  USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS parent_notification_prefs_insert ON public.parent_notification_preferences;
CREATE POLICY parent_notification_prefs_insert ON public.parent_notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS parent_notification_prefs_update ON public.parent_notification_preferences;
CREATE POLICY parent_notification_prefs_update ON public.parent_notification_preferences
  FOR UPDATE TO authenticated
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.parent_notification_preferences TO authenticated;

COMMENT ON TABLE public.parent_notification_preferences IS 'Parent global notification + quiet hours (Phase 28)';
COMMENT ON COLUMN public.emergency_program_consents.share_photos IS 'Photo tagging consent per program (Phase 28)';
