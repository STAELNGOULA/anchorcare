-- Phase 25: Parent ↔ business messaging + program broadcasts
-- Child-safety: parent_id required on every thread; minors cannot authenticate.

CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.program_registrations(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  parent_last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT message_threads_parent_required CHECK (parent_id IS NOT NULL),
  CONSTRAINT message_threads_program_child_unique UNIQUE (program_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_message_threads_parent_updated
  ON public.message_threads (parent_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_message_threads_org_updated
  ON public.message_threads (org_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_message_threads_program
  ON public.message_threads (program_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.message_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 500),
  recipient_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_broadcasts_program_created
  ON public.message_broadcasts (program_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('parent', 'staff', 'system')),
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'broadcast', 'system')),
  broadcast_id UUID REFERENCES public.message_broadcasts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_parent_sender_matches_thread CHECK (
    sender_role <> 'parent'
    OR sender_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created
  ON public.messages (thread_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.touch_message_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.message_threads
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.body, 120)
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_touch_thread ON public.messages;
CREATE TRIGGER trg_messages_touch_thread
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_message_thread();

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_broadcasts ENABLE ROW LEVEL SECURITY;

-- Threads: parent always included
DROP POLICY IF EXISTS message_threads_parent_select ON public.message_threads;
CREATE POLICY message_threads_parent_select ON public.message_threads
  FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS message_threads_parent_update ON public.message_threads;
CREATE POLICY message_threads_parent_update ON public.message_threads
  FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS message_threads_staff_select ON public.message_threads;
CREATE POLICY message_threads_staff_select ON public.message_threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = message_threads.org_id
        AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = message_threads.program_id
        AND pc.user_id = auth.uid()
    )
  );

-- Messages
DROP POLICY IF EXISTS messages_thread_parent_select ON public.messages;
CREATE POLICY messages_thread_parent_select ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = messages.thread_id
        AND t.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_thread_staff_select ON public.messages;
CREATE POLICY messages_thread_staff_select ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = messages.thread_id
        AND (
          EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.org_id = t.org_id AND om.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.program_coaches pc
            WHERE pc.program_id = t.program_id AND pc.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS messages_parent_insert ON public.messages;
CREATE POLICY messages_parent_insert ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'parent'
    AND sender_id = auth.uid()
    AND message_type = 'text'
    AND EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id AND t.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_staff_insert ON public.messages;
CREATE POLICY messages_staff_insert ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'staff'
    AND sender_id = auth.uid()
    AND message_type IN ('text', 'broadcast')
    AND EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
        AND (
          EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.org_id = t.org_id AND om.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.program_coaches pc
            WHERE pc.program_id = t.program_id AND pc.user_id = auth.uid()
          )
        )
    )
  );

-- Broadcasts: org staff only
DROP POLICY IF EXISTS message_broadcasts_staff_select ON public.message_broadcasts;
CREATE POLICY message_broadcasts_staff_select ON public.message_broadcasts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = message_broadcasts.org_id
        AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.program_coaches pc
      WHERE pc.program_id = message_broadcasts.program_id
        AND pc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS message_broadcasts_staff_insert ON public.message_broadcasts;
CREATE POLICY message_broadcasts_staff_insert ON public.message_broadcasts
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = message_broadcasts.org_id
        AND om.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.message_threads IS 'Phase 25 parent-inclusive program threads (one per child per program)';
COMMENT ON TABLE public.messages IS 'Phase 25 thread messages — parent always on child threads';
COMMENT ON TABLE public.message_broadcasts IS 'Phase 25 program broadcast log for rate limiting';
