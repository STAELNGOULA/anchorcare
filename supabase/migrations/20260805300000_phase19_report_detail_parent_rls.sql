-- Phase 19: Parent read access to published daily reports

DROP POLICY IF EXISTS report_children_parent_select ON public.report_children;
CREATE POLICY report_children_parent_select ON public.report_children
  FOR SELECT
  USING (
    status = 'published'
    AND child_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = report_children.child_id
        AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS daily_reports_parent_select ON public.daily_reports;
CREATE POLICY daily_reports_parent_select ON public.daily_reports
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.report_children rc
      JOIN public.children c ON c.id = rc.child_id
      WHERE rc.daily_report_id = daily_reports.id
        AND rc.status = 'published'
        AND c.parent_id = auth.uid()
    )
  );

COMMENT ON POLICY report_children_parent_select ON public.report_children IS
  'Phase 19 — parents read published per-child report bodies';
COMMENT ON POLICY daily_reports_parent_select ON public.daily_reports IS
  'Phase 19 — parents read published report metadata for their children';
