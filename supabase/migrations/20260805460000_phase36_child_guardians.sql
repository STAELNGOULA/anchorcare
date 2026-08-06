-- Phase 36: Co-parent / guardian invites

DO $$ BEGIN
  CREATE TYPE public.guardian_permission AS ENUM ('view', 'full');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.guardian_invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.child_guardian_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  primary_parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_email TEXT NOT NULL,
  permission public.guardian_permission NOT NULL DEFAULT 'view',
  token_hash TEXT NOT NULL UNIQUE,
  status public.guardian_invite_status NOT NULL DEFAULT 'pending',
  guardian_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.child_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  guardian_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.guardian_permission NOT NULL DEFAULT 'view',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, guardian_user_id)
);

CREATE INDEX IF NOT EXISTS idx_child_guardian_invites_parent
  ON public.child_guardian_invites (primary_parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_child_guardians_user
  ON public.child_guardians (guardian_user_id);

ALTER TABLE public.child_guardian_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS children_guardian_select ON public.children;
CREATE POLICY children_guardian_select ON public.children
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_guardians cg
      WHERE cg.child_id = children.id
        AND cg.guardian_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS child_guardian_invites_primary_all ON public.child_guardian_invites;
CREATE POLICY child_guardian_invites_primary_all ON public.child_guardian_invites
  FOR ALL TO authenticated
  USING (primary_parent_id = (SELECT auth.uid()))
  WITH CHECK (primary_parent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS child_guardian_invites_email_select ON public.child_guardian_invites;
CREATE POLICY child_guardian_invites_email_select ON public.child_guardian_invites
  FOR SELECT TO authenticated
  USING (
    status = 'pending'
    AND expires_at > NOW()
    AND lower(invite_email) = lower(
      COALESCE((SELECT email FROM auth.users WHERE id = (SELECT auth.uid())), '')
    )
  );

DROP POLICY IF EXISTS child_guardians_primary_select ON public.child_guardians;
CREATE POLICY child_guardians_primary_select ON public.child_guardians
  FOR SELECT TO authenticated
  USING (
    invited_by = (SELECT auth.uid())
    OR guardian_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_guardians.child_id AND c.parent_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS child_guardians_guardian_select ON public.child_guardians;
CREATE POLICY child_guardians_guardian_select ON public.child_guardians
  FOR SELECT TO authenticated
  USING (guardian_user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_guardian_invites TO authenticated;
GRANT SELECT ON public.child_guardians TO authenticated;

COMMENT ON TABLE public.child_guardian_invites IS 'Phase 36 co-parent invite tokens';
COMMENT ON TABLE public.child_guardians IS 'Phase 36 active co-parent/guardian access';
