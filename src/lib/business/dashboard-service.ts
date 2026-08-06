import { createClient } from "@/lib/supabase/server";

export type OrgDashboardStats = {
  publicPageEnabled: boolean;
  publicSlug: string;
  programCount: number;
  invitesSent: number;
  invitesAccepted: number;
  registrationsActive: number;
  registrationsPending: number;
  activationPercent: number;
  reportsPublishedToday: number;
  reportsThisWeek: number;
  incidents7d: number;
  voiceDaysUsed: number;
  waporPercent: number | null;
  pageViews7d: number;
  pageViews30d: number;
  registrations7d: number;
  registrations30d: number;
  funnelInvited: number;
  funnelRegistered: number;
  funnelAppOpened: number;
  funnelReportRead: number;
};

const EMPTY_STATS: OrgDashboardStats = {
  publicPageEnabled: false,
  publicSlug: "",
  programCount: 0,
  invitesSent: 0,
  invitesAccepted: 0,
  registrationsActive: 0,
  registrationsPending: 0,
  activationPercent: 0,
  reportsPublishedToday: 0,
  reportsThisWeek: 0,
  incidents7d: 0,
  voiceDaysUsed: 0,
  waporPercent: null,
  pageViews7d: 0,
  pageViews30d: 0,
  registrations7d: 0,
  registrations30d: 0,
  funnelInvited: 0,
  funnelRegistered: 0,
  funnelAppOpened: 0,
  funnelReportRead: 0,
};

function mapStatsRow(raw: Record<string, unknown>): OrgDashboardStats {
  return {
    publicPageEnabled: Boolean(raw.public_page_enabled),
    publicSlug: String(raw.public_slug ?? ""),
    programCount: Number(raw.program_count ?? 0),
    invitesSent: Number(raw.invites_sent ?? 0),
    invitesAccepted: Number(raw.invites_accepted ?? 0),
    registrationsActive: Number(raw.registrations_active ?? 0),
    registrationsPending: Number(raw.registrations_pending ?? 0),
    activationPercent: Number(raw.activation_percent ?? 0),
    reportsPublishedToday: Number(raw.reports_published_today ?? 0),
    reportsThisWeek: Number(raw.reports_this_week ?? 0),
    incidents7d: Number(raw.incidents_7d ?? 0),
    voiceDaysUsed: Number(raw.voice_days_used ?? 0),
    waporPercent:
      raw.wapor_percent == null ? null : Number(raw.wapor_percent),
    pageViews7d: Number(raw.page_views_7d ?? 0),
    pageViews30d: Number(raw.page_views_30d ?? 0),
    registrations7d: Number(raw.registrations_7d ?? 0),
    registrations30d: Number(raw.registrations_30d ?? 0),
    funnelInvited: Number(raw.funnel_invited ?? 0),
    funnelRegistered: Number(raw.funnel_registered ?? 0),
    funnelAppOpened: Number(raw.funnel_app_opened ?? 0),
    funnelReportRead: Number(raw.funnel_report_read ?? 0),
  };
}

async function fetchOrgDashboardStats(orgId: string): Promise<OrgDashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_dashboard_stats", {
    p_org_id: orgId,
  });

  if (error || !data || typeof data !== "object") {
    return EMPTY_STATS;
  }

  return mapStatsRow(data as Record<string, unknown>);
}

/** Session-scoped fetch — must not use unstable_cache (createClient uses cookies). */
export function getOrgDashboardStats(orgId: string) {
  return fetchOrgDashboardStats(orgId);
}
