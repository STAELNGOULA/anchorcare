import type {
  BusinessDigestMetrics,
  OrgDigestSettings,
  ParentDigestChildSummary,
  UpdateOrgDigestSettingsInput,
} from "@/lib/digest/digest-types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  incidentsTable,
  reportsTable,
  timelineEventsTable,
} from "@/lib/reports/table-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function digestSettingsTable(client: { from: (table: string) => any }): any {
  return client.from("org_digest_settings" as "organizations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function digestSendLogTable(client: { from: (table: string) => any }): any {
  return client.from("digest_send_log" as "organizations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notificationPrefsTable(client: { from: (table: string) => any }): any {
  return client.from("parent_notification_preferences" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engagementEventsTable(client: { from: (table: string) => any }): any {
  return client.from("parent_engagement_events" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subscriptionsTable(client: { from: (table: string) => any }): any {
  return client.from("subscriptions" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coachDigestPrefsTable(client: { from: (table: string) => any }): any {
  return client.from("coach_digest_preferences" as "profiles");
}

const DEFAULT_DIGEST_SETTINGS: Omit<OrgDigestSettings, "orgId"> = {
  businessEnabled: true,
  businessDeliveryDay: 1,
  businessRecipientEmails: [],
  coachDigestEnabled: true,
  timezone: "America/Toronto",
};

function parseRecipientEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is string => typeof e === "string")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getIsoWeekPeriodKey(date = new Date()): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function localDayInTimezone(timezone: string, date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    }).formatToParts(date);
    const weekday = parts.find((p) => p.type === "weekday")?.value;
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[weekday ?? "Mon"] ?? date.getDay();
  } catch {
    return date.getDay();
  }
}

export async function getOrgDigestSettings(orgId: string): Promise<OrgDigestSettings> {
  const service = createServiceClient();
  const { data } = await digestSettingsTable(service)
    .select(
      "org_id, business_enabled, business_delivery_day, business_recipient_emails, coach_digest_enabled, timezone",
    )
    .eq("org_id", orgId)
    .maybeSingle();

  if (!data) {
    return { orgId, ...DEFAULT_DIGEST_SETTINGS };
  }

  return {
    orgId,
    businessEnabled: Boolean(data.business_enabled),
    businessDeliveryDay: Number(data.business_delivery_day ?? 1),
    businessRecipientEmails: parseRecipientEmails(data.business_recipient_emails),
    coachDigestEnabled: Boolean(data.coach_digest_enabled),
    timezone: data.timezone ?? DEFAULT_DIGEST_SETTINGS.timezone,
  };
}

export async function updateOrgDigestSettings(
  orgId: string,
  input: UpdateOrgDigestSettingsInput,
): Promise<OrgDigestSettings> {
  const service = createServiceClient();
  const now = new Date().toISOString();
  const emails = input.businessRecipientEmails
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const { data, error } = await digestSettingsTable(service)
    .upsert({
      org_id: orgId,
      business_enabled: input.businessEnabled,
      business_delivery_day: input.businessDeliveryDay,
      business_recipient_emails: emails,
      coach_digest_enabled: input.coachDigestEnabled,
      timezone: input.timezone,
      updated_at: now,
    })
    .select(
      "org_id, business_enabled, business_delivery_day, business_recipient_emails, coach_digest_enabled, timezone",
    )
    .single();

  if (error) throw error;

  return {
    orgId,
    businessEnabled: Boolean(data.business_enabled),
    businessDeliveryDay: Number(data.business_delivery_day),
    businessRecipientEmails: parseRecipientEmails(data.business_recipient_emails),
    coachDigestEnabled: Boolean(data.coach_digest_enabled),
    timezone: data.timezone,
  };
}

export async function recordDigestSent(
  digestType: "parent" | "business" | "coach",
  recipientId: string,
  periodKey: string,
): Promise<boolean> {
  const service = createServiceClient();
  const { error } = await digestSendLogTable(service).insert({
    digest_type: digestType,
    recipient_id: recipientId,
    period_key: periodKey,
  });

  return !error;
}

export async function wasDigestSent(
  digestType: "parent" | "business" | "coach",
  recipientId: string,
  periodKey: string,
): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await digestSendLogTable(service)
    .select("id")
    .eq("digest_type", digestType)
    .eq("recipient_id", recipientId)
    .eq("period_key", periodKey)
    .maybeSingle();

  return Boolean(data);
}

export async function buildParentDigestSummaries(
  parentId: string,
): Promise<ParentDigestChildSummary[]> {
  const service = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: children } = await service
    .from("children")
    .select("id, first_name, last_name")
    .eq("parent_id", parentId);

  if (!children?.length) return [];

  const summaries: ParentDigestChildSummary[] = [];

  for (const child of children) {
    const { data: reg } = await service
      .from("program_registrations")
      .select("program_id, programs(name)")
      .eq("child_id", child.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const programName =
      (reg?.programs as { name: string } | null)?.name ?? "Program";

    const { count: reportsCount } = await timelineEventsTable(service)
      .select("id", { count: "exact", head: true })
      .eq("child_id", child.id)
      .eq("event_type", "daily_report")
      .gte("occurred_at", weekAgo);

    const { count: photoCount } = await timelineEventsTable(service)
      .select("id", { count: "exact", head: true })
      .eq("child_id", child.id)
      .eq("event_type", "photo")
      .gte("occurred_at", weekAgo);

    const { count: incidentCount } = await incidentsTable(service)
      .select("id", { count: "exact", head: true })
      .eq("child_id", child.id)
      .gte("occurred_at", weekAgo);

    summaries.push({
      childId: child.id,
      childName: `${child.first_name} ${child.last_name}`.trim(),
      programName,
      reportsCount: reportsCount ?? 0,
      photoCount: photoCount ?? 0,
      incidentCount: incidentCount ?? 0,
    });
  }

  return summaries;
}

export async function buildBusinessDigestMetrics(orgId: string): Promise<BusinessDigestMetrics> {
  const service = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: org } = await service
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const { count: invitesSent } = await service
    .from("invites")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("invite_type", "parent");

  const { count: regActive } = await service
    .from("program_registrations")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "active");

  const { count: regPending } = await service
    .from("program_registrations")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "pending");

  const invites = invitesSent ?? 0;
  const active = regActive ?? 0;
  const activationPercent =
    invites > 0 ? Math.min(100, Math.round((active / invites) * 100)) : active > 0 ? 100 : 0;

  const { count: reportsThisWeek } = await reportsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "published")
    .gte("published_at", weekAgo);

  const { count: incidents7d } = await incidentsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("occurred_at", weekAgo);

  const { count: voiceDaysUsed } = await reportsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .not("audio_path", "is", null)
    .gte("created_at", weekAgo);

  const { count: funnelReportRead } = await engagementEventsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("event_type", "report_read")
    .gte("created_at", weekAgo);

  const { data: sub } = await subscriptionsTable(service)
    .select("trial_ends_at, status")
    .eq("org_id", orgId)
    .maybeSingle();

  let trialDaysLeft: number | null = null;
  if (sub?.trial_ends_at && sub.status === "trialing") {
    const ms = new Date(sub.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(ms / 86400000));
  }

  const registered = active + (regPending ?? 0);
  const read = funnelReportRead ?? 0;
  const waporPercent =
    registered > 0 ? Math.min(100, Math.round((read / registered) * 100)) : null;

  return {
    orgName: org?.name ?? "Your organization",
    activationPercent,
    reportsThisWeek: reportsThisWeek ?? 0,
    incidents7d: incidents7d ?? 0,
    voiceDaysUsed: voiceDaysUsed ?? 0,
    waporPercent,
    trialDaysLeft,
    funnelReportRead: read,
    funnelRegistered: registered,
  };
}

export async function getDirectorEmail(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.id === userId && data.user.email) return data.user.email;

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const { data: authUser } = await service.auth.admin.getUserById(userId);
  return authUser?.user?.email ?? null;
}

export async function listDigestEligibleParents(): Promise<
  { parentId: string; email: string; timezone: string }[]
> {
  const service = createServiceClient();
  const { data: parents } = await service.from("profiles").select("id").eq("role", "parent");

  const results: { parentId: string; email: string; timezone: string }[] = [];

  for (const parent of parents ?? []) {
    const { data: pref } = await notificationPrefsTable(service)
      .select("email_digest_enabled, timezone")
      .eq("parent_id", parent.id)
      .maybeSingle();

    const enabled = pref ? Boolean(pref.email_digest_enabled) : true;
    if (!enabled) continue;

    const { data: authUser } = await service.auth.admin.getUserById(parent.id);
    const email = authUser?.user?.email;
    if (!email) continue;

    results.push({
      parentId: parent.id,
      email,
      timezone: pref?.timezone ?? "America/Toronto",
    });
  }

  return results;
}

export async function listDigestEligibleOrgs(): Promise<
  { orgId: string; timezone: string; recipientEmails: string[]; directorId: string | null }[]
> {
  const service = createServiceClient();
  const { data: directors } = await service
    .from("org_members")
    .select("org_id, user_id")
    .eq("role", "director");

  const results: {
    orgId: string;
    timezone: string;
    recipientEmails: string[];
    directorId: string | null;
  }[] = [];

  for (const director of directors ?? []) {
    const { data: settings } = await digestSettingsTable(service)
      .select(
        "business_enabled, business_recipient_emails, timezone",
      )
      .eq("org_id", director.org_id)
      .maybeSingle();

    if (settings && !settings.business_enabled) continue;

    const emails = parseRecipientEmails(settings?.business_recipient_emails);
    if (emails.length === 0) {
      const { data: authUser } = await service.auth.admin.getUserById(director.user_id);
      if (authUser?.user?.email) {
        emails.push(authUser.user.email);
      }
    }

    if (emails.length === 0) continue;

    results.push({
      orgId: director.org_id,
      timezone: settings?.timezone ?? DEFAULT_DIGEST_SETTINGS.timezone,
      recipientEmails: emails,
      directorId: director.user_id,
    });
  }

  return results;
}

export async function listDigestEligibleCoaches(): Promise<
  { coachId: string; email: string; orgId: string }[]
> {
  const service = createServiceClient();
  const { data: coaches } = await service
    .from("profiles")
    .select("id")
    .eq("role", "coach");

  const results: { coachId: string; email: string; orgId: string }[] = [];

  for (const coach of coaches ?? []) {
    const { data: pref } = await coachDigestPrefsTable(service)
      .select("enabled")
      .eq("coach_id", coach.id)
      .maybeSingle();

    if (pref && !pref.enabled) continue;

    const { data: member } = await service
      .from("org_members")
      .select("org_id")
      .eq("user_id", coach.id)
      .limit(1)
      .maybeSingle();

    if (!member?.org_id) continue;

    const { data: orgDigest } = await digestSettingsTable(service)
      .select("coach_digest_enabled")
      .eq("org_id", member.org_id)
      .maybeSingle();

    if (orgDigest && !orgDigest.coach_digest_enabled) continue;

    const { data: authUser } = await service.auth.admin.getUserById(coach.id);
    const email = authUser?.user?.email;
    if (!email) continue;

    results.push({ coachId: coach.id, email, orgId: member.org_id });
  }

  return results;
}
