import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOrgDashboardStats } from "@/lib/business/dashboard-service";
import type { OrgDashboardStats } from "@/lib/business/dashboard-service";
import { needsBusinessOnboarding } from "@/lib/business/onboarding-state";
import { listHandoffNotesForOrg } from "@/lib/handoff/handoff-service";
import type { HandoffNote } from "@/lib/handoff/handoff-types";

const TRIAL_DAYS = 14;

export type DashboardChecklistItem = {
  id: string;
  done: boolean;
  href: string;
};

export type DashboardAction = {
  id: string;
  href: string;
  tone: "default" | "accent";
};

export type DashboardKpiMetric = {
  key: string;
  value: number | null;
  display: string;
  suffix?: string;
  pending: boolean;
  pendingNote?: string;
};

export type DirectorContext = {
  userId: string;
  email: string;
  orgId: string | null;
  orgName: string;
  trialDaysLeft: number;
  trialActive: boolean;
  showTrialEndingModal: boolean;
  publicSlug: string;
  publicPageUrl: string | null;
  checklist: DashboardChecklistItem[];
  checklistComplete: boolean;
  actions: DashboardAction[];
  stats: OrgDashboardStats;
  kpis: DashboardKpiMetric[];
  today: {
    reportsPublished: number;
    pendingRegistrations: number;
    handoffNotes: HandoffNote[];
  };
  funnel: {
    invited: number;
    registered: number;
    appOpened: number;
    reportRead: number;
  };
};

function buildKpis(stats: OrgDashboardStats): DashboardKpiMetric[] {
  return [
    {
      key: "activation",
      value: stats.activationPercent,
      display: `${stats.activationPercent}%`,
      suffix: "%",
      pending: stats.invitesSent === 0 && stats.registrationsActive === 0,
      pendingNote: "activation",
    },
    {
      key: "wapor",
      value: stats.waporPercent,
      display: stats.waporPercent != null ? `${stats.waporPercent}%` : "—",
      suffix: "%",
      pending: stats.waporPercent == null,
      pendingNote: "wapor",
    },
    {
      key: "incidents",
      value: stats.incidents7d,
      display: String(stats.incidents7d),
      pending: false,
    },
    {
      key: "voiceDays",
      value: stats.voiceDaysUsed,
      display: String(stats.voiceDaysUsed),
      pending: stats.voiceDaysUsed === 0,
      pendingNote: "voiceDays",
    },
  ];
}

export async function getDirectorContext(): Promise<DirectorContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/business/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_status, full_name, org_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "business_admin") {
    redirect("/login");
  }

  if (needsBusinessOnboarding(profile.org_id)) {
    redirect("/business/onboarding");
  }

  const email = user.email ?? "";
  const orgId = profile.org_id ?? null;

  let orgName = profile?.full_name?.trim()
    ? `${profile.full_name.split(/\s+/)[0]}'s program`
    : "Your program";

  let trialStart = profile?.created_at ? new Date(profile.created_at) : new Date();
  let publicSlug = "";

  if (orgId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, trial_started_at, public_slug")
      .eq("id", orgId)
      .maybeSingle();

    if (org?.name) orgName = org.name;
    if (org?.trial_started_at) trialStart = new Date(org.trial_started_at);
    if (org?.public_slug) publicSlug = org.public_slug;
  }

  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const trialActive = trialDaysLeft > 0;
  const showTrialEndingModal = trialActive && trialDaysLeft <= 3;

  const stats = orgId ? await getOrgDashboardStats(orgId) : {
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

  const checklist: DashboardChecklistItem[] = [
    {
      id: "publicPage",
      done: stats.publicPageEnabled,
      href: "/business/settings/profile",
    },
    {
      id: "program",
      done: stats.programCount > 0,
      href: "/business/programs/new",
    },
    {
      id: "invite",
      done: stats.invitesSent > 0,
      href: "/business/settings/invites",
    },
    {
      id: "report",
      done: stats.reportsThisWeek > 0,
      href: "/business/reports",
    },
  ];

  const checklistComplete = checklist.every((item) => item.done);

  const actions: DashboardAction[] = [
    { id: "share-public-page", href: "#share", tone: "accent" },
    { id: "invite-families", href: "/business/settings/invites", tone: "default" },
    { id: "view-roster", href: "/business/families/children", tone: "default" },
  ];

  const publicPageUrl = publicSlug ? `/p/${publicSlug}` : null;

  const handoffNotes = orgId ? await listHandoffNotesForOrg(orgId) : [];

  return {
    userId: user.id,
    email,
    orgId,
    orgName,
    trialDaysLeft,
    trialActive,
    showTrialEndingModal,
    publicSlug,
    publicPageUrl,
    checklist,
    checklistComplete,
    actions,
    stats,
    kpis: buildKpis(stats),
    today: {
      reportsPublished: stats.reportsPublishedToday,
      pendingRegistrations: stats.registrationsPending,
      handoffNotes,
    },
    funnel: {
      invited: stats.funnelInvited,
      registered: stats.funnelRegistered,
      appOpened: stats.funnelAppOpened,
      reportRead: stats.funnelReportRead,
    },
  };
}
