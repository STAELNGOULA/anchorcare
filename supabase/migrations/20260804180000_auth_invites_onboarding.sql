-- Auth invites + onboarding (merged into initial remote apply)
-- See 20260804140000_initial_schema.sql for baseline; remote project applied combined migration.

CREATE TYPE public.onboarding_status AS ENUM (
  'pending_link',
  'program_setup',
  'active'
);

CREATE TYPE public.invite_type AS ENUM (
  'parent',
  'coach'
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status public.onboarding_status NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  invite_type public.invite_type NOT NULL DEFAULT 'parent',
  email TEXT,
  program_name TEXT NOT NULL,
  child_first_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites (token);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS invites_deny_client ON public.invites
  FOR ALL USING (false);
