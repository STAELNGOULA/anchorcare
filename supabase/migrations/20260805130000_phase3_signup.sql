-- Phase 3: Sign up — profile attribution, terms timestamp, audit events

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signup_source') THEN
    CREATE TYPE public.signup_source AS ENUM ('organic', 'public_page', 'invite');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS signup_source public.signup_source NOT NULL DEFAULT 'organic',
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

ALTER TABLE public.auth_audit_log
  DROP CONSTRAINT IF EXISTS auth_audit_log_event_type_check;

ALTER TABLE public.auth_audit_log
  ADD CONSTRAINT auth_audit_log_event_type_check CHECK (
    event_type IN (
      'login_success',
      'login_fail',
      'oauth_success',
      'oauth_fail',
      'password_reset_requested',
      'password_reset_completed',
      'signup_success',
      'signup_fail'
    )
  );
