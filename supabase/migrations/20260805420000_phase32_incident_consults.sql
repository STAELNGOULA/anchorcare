-- Phase 32: Incident consult queue + async clinical chat

DO $$ BEGIN
  CREATE TYPE public.consult_status AS ENUM ('pending', 'assigned', 'open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.consult_priority AS ENUM ('normal', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.incident_consults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  status public.consult_status NOT NULL DEFAULT 'pending',
  priority public.consult_priority NOT NULL DEFAULT 'normal',
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  initial_message TEXT NOT NULL,
  care_plan_summary TEXT,
  clearance_status TEXT
    CHECK (
      clearance_status IS NULL
      OR clearance_status IN ('cleared', 'restricted', 'cleared_with_conditions')
    ),
  clearance_conditions TEXT,
  clearance_expires_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_consult_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consult_id UUID NOT NULL REFERENCES public.incident_consults(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL
    CHECK (sender_role IN ('parent', 'admin', 'system')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_consults_queue
  ON public.incident_consults (status, priority DESC, created_at ASC)
  WHERE status IN ('pending', 'assigned', 'open');

CREATE INDEX IF NOT EXISTS idx_incident_consults_parent
  ON public.incident_consults (parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_consult_messages_consult
  ON public.incident_consult_messages (consult_id, created_at ASC);

ALTER TABLE public.incident_consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_consult_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incident_consults_parent_select ON public.incident_consults;
CREATE POLICY incident_consults_parent_select ON public.incident_consults
  FOR SELECT TO authenticated
  USING (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS incident_consults_parent_insert ON public.incident_consults;
CREATE POLICY incident_consults_parent_insert ON public.incident_consults
  FOR INSERT TO authenticated
  WITH CHECK (parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS incident_consults_admin_all ON public.incident_consults;
CREATE POLICY incident_consults_admin_all ON public.incident_consults
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS incident_consult_messages_parent_select ON public.incident_consult_messages;
CREATE POLICY incident_consult_messages_parent_select ON public.incident_consult_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.incident_consults c
      WHERE c.id = incident_consult_messages.consult_id
        AND c.parent_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS incident_consult_messages_parent_insert ON public.incident_consult_messages;
CREATE POLICY incident_consult_messages_parent_insert ON public.incident_consult_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'parent'
    AND sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.incident_consults c
      WHERE c.id = incident_consult_messages.consult_id
        AND c.parent_id = (SELECT auth.uid())
        AND c.status IN ('assigned', 'open')
    )
  );

DROP POLICY IF EXISTS incident_consult_messages_admin_all ON public.incident_consult_messages;
CREATE POLICY incident_consult_messages_admin_all ON public.incident_consult_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

GRANT SELECT, INSERT ON public.incident_consults TO authenticated;
GRANT ALL ON public.incident_consults TO authenticated;
GRANT SELECT, INSERT ON public.incident_consult_messages TO authenticated;
GRANT ALL ON public.incident_consult_messages TO authenticated;

COMMENT ON TABLE public.incident_consults IS 'Phase 32 async incident clinical consult queue';
COMMENT ON TABLE public.incident_consult_messages IS 'Phase 32 consult chat messages';
