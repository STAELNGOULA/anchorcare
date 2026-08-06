-- Phase 18: SMS web report access tokens

CREATE TABLE IF NOT EXISTS public.report_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  report_child_id UUID NOT NULL REFERENCES public.report_children(id) ON DELETE CASCADE,
  daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  max_views INT NOT NULL DEFAULT 50,
  revoked_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  last_view_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_access_tokens_hash
  ON public.report_access_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_report_access_tokens_report_child
  ON public.report_access_tokens (report_child_id);

CREATE INDEX IF NOT EXISTS idx_report_access_tokens_daily_report
  ON public.report_access_tokens (daily_report_id);

ALTER TABLE public.report_access_tokens ENABLE ROW LEVEL SECURITY;

-- Service role only — parents access via unguessable token URL, not direct table reads.
COMMENT ON TABLE public.report_access_tokens IS 'Phase 18 hashed SMS tokens for /r/[token] viewer';
