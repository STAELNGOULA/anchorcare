-- Phase 9: Director dashboard stats RPC (5 min cache at app layer)

CREATE OR REPLACE FUNCTION public.org_dashboard_stats(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invites_sent INTEGER := 0;
  v_invites_accepted INTEGER := 0;
  v_reg_active INTEGER := 0;
  v_reg_pending INTEGER := 0;
  v_program_count INTEGER := 0;
  v_public_page_enabled BOOLEAN := false;
  v_public_slug TEXT := '';
  v_activation_percent INTEGER := 0;
  v_page_views_7d INTEGER := 0;
  v_page_views_30d INTEGER := 0;
  v_registrations_7d INTEGER := 0;
  v_registrations_30d INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = p_org_id
      AND om.user_id = v_user_id
      AND om.role IN ('director', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_invites_sent
  FROM public.invites i
  WHERE i.org_id = p_org_id AND i.invite_type = 'parent';

  SELECT COUNT(*)::INTEGER INTO v_invites_accepted
  FROM public.invites i
  WHERE i.org_id = p_org_id
    AND i.invite_type = 'parent'
    AND i.used_at IS NOT NULL;

  SELECT
    COUNT(*) FILTER (WHERE pr.status = 'active')::INTEGER,
    COUNT(*) FILTER (WHERE pr.status = 'pending')::INTEGER
  INTO v_reg_active, v_reg_pending
  FROM public.program_registrations pr
  WHERE pr.org_id = p_org_id;

  SELECT COUNT(*)::INTEGER INTO v_program_count
  FROM public.programs p
  WHERE p.org_id = p_org_id;

  SELECT o.public_page_enabled, o.public_slug
  INTO v_public_page_enabled, v_public_slug
  FROM public.organizations o
  WHERE o.id = p_org_id;

  IF v_invites_sent > 0 THEN
    v_activation_percent := LEAST(
      100,
      ROUND((v_reg_active::NUMERIC / v_invites_sent::NUMERIC) * 100)
    )::INTEGER;
  ELSIF v_reg_active > 0 THEN
    v_activation_percent := 100;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_page_views_7d
  FROM public.public_page_events e
  WHERE e.org_id = p_org_id
    AND e.event_type = 'view'
    AND e.created_at >= v_now - INTERVAL '7 days';

  SELECT COUNT(*)::INTEGER INTO v_page_views_30d
  FROM public.public_page_events e
  WHERE e.org_id = p_org_id
    AND e.event_type = 'view'
    AND e.created_at >= v_now - INTERVAL '30 days';

  SELECT COUNT(*)::INTEGER INTO v_registrations_7d
  FROM public.program_registrations pr
  WHERE pr.org_id = p_org_id
    AND pr.created_at >= v_now - INTERVAL '7 days';

  SELECT COUNT(*)::INTEGER INTO v_registrations_30d
  FROM public.program_registrations pr
  WHERE pr.org_id = p_org_id
    AND pr.created_at >= v_now - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'public_page_enabled', v_public_page_enabled,
    'public_slug', v_public_slug,
    'program_count', v_program_count,
    'invites_sent', v_invites_sent,
    'invites_accepted', v_invites_accepted,
    'registrations_active', v_reg_active,
    'registrations_pending', v_reg_pending,
    'activation_percent', v_activation_percent,
    'reports_published_today', 0,
    'reports_this_week', 0,
    'incidents_7d', 0,
    'voice_days_used', 0,
    'wapor_percent', NULL,
    'page_views_7d', v_page_views_7d,
    'page_views_30d', v_page_views_30d,
    'registrations_7d', v_registrations_7d,
    'registrations_30d', v_registrations_30d,
    'funnel_invited', v_invites_sent,
    'funnel_registered', v_reg_active + v_reg_pending,
    'funnel_app_opened', v_reg_active,
    'funnel_report_read', 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.org_dashboard_stats(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_dashboard_stats(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.org_dashboard_stats(UUID) TO authenticated;
