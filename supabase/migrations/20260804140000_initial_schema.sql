-- ANCHOR_CARE initial schema (apply to dedicated Supabase project)
-- Rollback: DROP TABLE IF EXISTS background_jobs; DROP TABLE IF EXISTS profiles;

CREATE TYPE public.user_role AS ENUM (
  'parent',
  'business_admin',
  'coach',
  'admin'
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'parent',
  full_name TEXT,
  country TEXT CHECK (country IN ('US', 'CA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_background_jobs_status_next_run
  ON public.background_jobs (status, next_run_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role processes jobs; no client access
CREATE POLICY background_jobs_deny_all ON public.background_jobs
  FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
