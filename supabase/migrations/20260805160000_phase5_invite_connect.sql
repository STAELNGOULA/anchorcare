-- Phase 5: Invite accept + connect program

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS token_hash TEXT;

UPDATE public.invites
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_token_hash ON public.invites (token_hash)
  WHERE token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  photo_url TEXT,
  allergies TEXT,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  medical_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children (parent_id);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY children_parent_select ON public.children
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY children_parent_insert ON public.children
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY children_parent_update ON public.children
  FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY children_parent_delete ON public.children
  FOR DELETE USING (parent_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.program_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES public.invites(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'withdrawn')),
  copy_health_profile BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_program_registrations_program_id
  ON public.program_registrations (program_id);
CREATE INDEX IF NOT EXISTS idx_program_registrations_parent_id
  ON public.program_registrations (parent_id);
CREATE INDEX IF NOT EXISTS idx_program_registrations_org_id
  ON public.program_registrations (org_id);

ALTER TABLE public.program_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY program_registrations_parent_select ON public.program_registrations
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY program_registrations_org_member_select ON public.program_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = program_registrations.org_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY program_registrations_deny_client_insert ON public.program_registrations
  FOR INSERT WITH CHECK (false);

CREATE POLICY program_registrations_deny_client_update ON public.program_registrations
  FOR UPDATE USING (false);

CREATE POLICY program_registrations_deny_client_delete ON public.program_registrations
  FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION public.accept_parent_invite(
  p_user_id UUID,
  p_token TEXT,
  p_child_id UUID DEFAULT NULL,
  p_new_child_first_name TEXT DEFAULT NULL,
  p_new_child_last_name TEXT DEFAULT NULL,
  p_new_child_dob DATE DEFAULT NULL,
  p_copy_health_profile BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites%ROWTYPE;
  v_token_hash TEXT;
  v_child_id UUID;
  v_registration_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT * INTO v_invite
  FROM public.invites
  WHERE token_hash = v_token_hash OR token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'invite_used';
  END IF;

  IF v_invite.expires_at < v_now THEN
    RAISE EXCEPTION 'invite_expired';
  END IF;

  IF v_invite.invite_type = 'coach' THEN
    RAISE EXCEPTION 'wrong_invite_type';
  END IF;

  UPDATE public.invites
  SET used_at = v_now, used_by = p_user_id
  WHERE id = v_invite.id AND used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_used';
  END IF;

  UPDATE public.profiles
  SET role = 'parent', onboarding_status = 'active', updated_at = v_now
  WHERE id = p_user_id;

  IF p_child_id IS NOT NULL THEN
    SELECT id INTO v_child_id
    FROM public.children
    WHERE id = p_child_id AND parent_id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'child_not_found';
    END IF;
  ELSIF p_new_child_first_name IS NOT NULL AND length(trim(p_new_child_first_name)) >= 1 THEN
    INSERT INTO public.children (parent_id, first_name, last_name, date_of_birth)
    VALUES (
      p_user_id,
      trim(p_new_child_first_name),
      coalesce(trim(p_new_child_last_name), ''),
      p_new_child_dob
    )
    RETURNING id INTO v_child_id;
  END IF;

  IF v_invite.program_id IS NOT NULL AND v_child_id IS NOT NULL THEN
    INSERT INTO public.program_registrations (
      program_id, org_id, child_id, parent_id, invite_id, status, copy_health_profile
    )
    VALUES (
      v_invite.program_id,
      v_invite.org_id,
      v_child_id,
      p_user_id,
      v_invite.id,
      'pending',
      coalesce(p_copy_health_profile, true)
    )
    ON CONFLICT (program_id, child_id) DO UPDATE
    SET invite_id = EXCLUDED.invite_id, updated_at = v_now
    RETURNING id INTO v_registration_id;
  END IF;

  RETURN coalesce(v_registration_id, v_invite.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_coach_invite(
  p_user_id UUID,
  p_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites%ROWTYPE;
  v_token_hash TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT * INTO v_invite
  FROM public.invites
  WHERE token_hash = v_token_hash OR token = p_token
  LIMIT 1;

  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF v_invite.used_at IS NOT NULL THEN RAISE EXCEPTION 'invite_used'; END IF;
  IF v_invite.expires_at < v_now THEN RAISE EXCEPTION 'invite_expired'; END IF;
  IF v_invite.invite_type <> 'coach' THEN RAISE EXCEPTION 'wrong_invite_type'; END IF;

  UPDATE public.invites
  SET used_at = v_now, used_by = p_user_id
  WHERE id = v_invite.id AND used_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'invite_used'; END IF;

  UPDATE public.profiles
  SET role = 'coach', onboarding_status = 'active', updated_at = v_now
  WHERE id = p_user_id;

  IF v_invite.org_id IS NOT NULL THEN
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_invite.org_id, p_user_id, 'coach')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN v_invite.id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_parent_invite FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_coach_invite FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_parent_invite TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_coach_invite TO authenticated;
