-- Phase 1: Login — profile tracking, audit log, rate limits

CREATE TYPE public.account_status AS ENUM ('active', 'suspended');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('login_success', 'login_fail', 'oauth_success', 'oauth_fail')
  ),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created
  ON public.auth_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_event
  ON public.auth_audit_log (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  attempt_count INT NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_audit_log_deny_client ON public.auth_audit_log
  FOR ALL USING (false);

CREATE POLICY auth_rate_limits_deny_client ON public.auth_rate_limits
  FOR ALL USING (false);
