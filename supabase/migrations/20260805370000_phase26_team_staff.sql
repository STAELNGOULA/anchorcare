-- Phase 26: Team + coach staff — deactivate access, program assignment on invite accept

ALTER TABLE public.org_members
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_org_members_org_active
  ON public.org_members (org_id, role)
  WHERE deactivated_at IS NULL;

COMMENT ON COLUMN public.org_members.deactivated_at IS 'Phase 26 — revoked field access; history retained';

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
  v_program_id UUID;
  v_assign_all BOOLEAN;
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
  SET
    role = 'coach',
    onboarding_status = 'active',
    org_id = COALESCE(v_invite.org_id, org_id),
    updated_at = v_now
  WHERE id = p_user_id;

  IF v_invite.org_id IS NOT NULL THEN
    INSERT INTO public.org_members (org_id, user_id, role, deactivated_at)
    VALUES (v_invite.org_id, p_user_id, 'coach', NULL)
    ON CONFLICT (user_id) DO UPDATE
      SET
        org_id = EXCLUDED.org_id,
        role = 'coach',
        deactivated_at = NULL;
  END IF;

  v_assign_all := COALESCE((v_invite.metadata->>'assign_all')::boolean, false);

  IF v_assign_all AND v_invite.org_id IS NOT NULL THEN
    INSERT INTO public.program_coaches (org_id, program_id, user_id)
    SELECT p.org_id, p.id, p_user_id
    FROM public.programs p
    WHERE p.org_id = v_invite.org_id
      AND p.status <> 'archived'
    ON CONFLICT (program_id, user_id) DO NOTHING;
  ELSIF v_invite.metadata ? 'program_ids' AND v_invite.org_id IS NOT NULL THEN
    FOR v_program_id IN
      SELECT (jsonb_array_elements_text(v_invite.metadata->'program_ids'))::uuid
    LOOP
      INSERT INTO public.program_coaches (org_id, program_id, user_id)
      SELECT v_invite.org_id, v_program_id, p_user_id
      FROM public.programs p
      WHERE p.id = v_program_id
        AND p.org_id = v_invite.org_id
      ON CONFLICT (program_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_invite.id;
END;
$$;
