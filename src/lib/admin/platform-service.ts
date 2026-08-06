import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_MRR_CENTS,
  SUBSCRIPTION_SKUS,
} from "@/lib/billing/billing-constants";
import { countPendingConsults } from "@/lib/consults/consult-service";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import type {
  AdminAnalyticsSnapshot,
  AdminAuditEntry,
  AdminBusinessDetail,
  AdminBusinessListItem,
  AdminUserDetail,
  AdminUserListItem,
  ModerationFlagItem,
  PlatformDashboardKpis,
  PlatformHealth,
  ResolveSlugDisputeInput,
  SlugDisputeItem,
} from "@/lib/admin/platform-types";
import {
  adminAuditLogTable,
  slugDisputesTable,
} from "@/lib/admin/table-utils";
import { createServiceClient } from "@/lib/supabase/service";

const SEARCH_LIMIT = 40;
const WAPOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subscriptionsTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("subscriptions" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engagementTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("parent_engagement_events" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reportChildrenTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("report_children" as "program_registrations");
}

function formatMrr(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const service = createServiceClient();
  await adminAuditLogTable(service).insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
    created_at: new Date().toISOString(),
  });
}

async function lookupEmails(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!userIds.length) return map;

  const service = createServiceClient();
  const unique = [...new Set(userIds)];

  await Promise.all(
    unique.map(async (id) => {
      const { data } = await service.auth.admin.getUserById(id);
      if (data.user?.email) map.set(id, data.user.email);
    }),
  );

  return map;
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const service = createServiceClient();
  const since = new Date(Date.now() - WEEK_MS).toISOString();

  const [{ count: pending }, { count: failed }, { data: smsJobs }] =
    await Promise.all([
      service
        .from("background_jobs")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "processing"]),
      service
        .from("background_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("updated_at", since),
      service
        .from("background_jobs")
        .select("status")
        .ilike("type", "%sms%")
        .gte("created_at", since),
    ]);

  const smsRows = (smsJobs ?? []) as { status: string }[];
  const smsTotal = smsRows.length;
  const smsFailed = smsRows.filter((j) => j.status === "failed").length;
  const smsFailureRatePercent =
    smsTotal > 0 ? Math.round((smsFailed / smsTotal) * 100) : null;

  return {
    pendingJobs: pending ?? 0,
    failedJobs: failed ?? 0,
    smsFailureRatePercent,
  };
}

export async function getPlatformDashboard(): Promise<PlatformDashboardKpis> {
  const service = createServiceClient();
  const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
  const waporSince = new Date(Date.now() - WAPOR_WINDOW_MS).toISOString();

  const [
    subscriptions,
    activeBusinesses,
    activeParents,
    weeklyParents,
    weeklyOrgs,
    waporParents,
    totalParents,
    openDisputes,
    flaggedReports,
    pendingConsults,
    health,
  ] = await Promise.all([
    subscriptionsTable(service)
      .select("sku, status")
      .in("status", [...ACTIVE_SUBSCRIPTION_STATUSES]),
    service
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .not("onboarding_completed_at", "is", null),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "parent")
      .eq("account_status", "active"),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "parent")
      .gte("created_at", weekAgo),
    service
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    engagementTable(service)
      .select("parent_id")
      .in("event_type", ["report_open", "report_read"])
      .gte("created_at", waporSince),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "parent"),
    slugDisputesTable(service)
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    reportChildrenTable(service)
      .select("id", { count: "exact", head: true })
      .or("status.eq.flagged,misassigned_flag.eq.true")
      .neq("status", "skipped"),
    countPendingConsults(),
    getPlatformHealth(),
  ]);

  let mrrCents = 0;
  for (const row of (subscriptions.data ?? []) as { sku: string }[]) {
    if (row.sku === SUBSCRIPTION_SKUS.parentFamily) {
      mrrCents += SUBSCRIPTION_MRR_CENTS.parent_family;
    } else if (row.sku === SUBSCRIPTION_SKUS.businessPro) {
      mrrCents += SUBSCRIPTION_MRR_CENTS.business_pro;
    }
  }

  const waporRows = (waporParents.data ?? []) as { parent_id: string }[];
  const uniqueWapor = new Set(waporRows.map((r) => r.parent_id)).size;
  const parentTotal = totalParents.count ?? 0;
  const waporPercent =
    parentTotal > 0 ? Math.round((uniqueWapor / parentTotal) * 100) : null;

  return {
    mrrCents,
    mrrDisplay: formatMrr(mrrCents),
    activeBusinesses: activeBusinesses.count ?? 0,
    activeParents: activeParents.count ?? 0,
    weeklyActivations: (weeklyParents.count ?? 0) + (weeklyOrgs.count ?? 0),
    waporPercent,
    pendingConsults,
    openSlugDisputes: openDisputes.count ?? 0,
    flaggedReports: flaggedReports.count ?? 0,
    health,
  };
}

export async function searchAdminUsers(query: string): Promise<AdminUserListItem[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const service = createServiceClient();

  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, role, account_status, created_at, last_login_at")
    .or(`full_name.ilike.%${q}%`)
    .limit(SEARCH_LIMIT);

  const { data: children } = await service
    .from("children")
    .select("parent_id, first_name, last_name")
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .limit(SEARCH_LIMIT);

  const childParentIds = [
    ...new Set((children ?? []).map((c: { parent_id: string }) => c.parent_id)),
  ];

  let extraProfiles: typeof profiles = [];
  if (childParentIds.length) {
    const { data } = await service
      .from("profiles")
      .select("id, full_name, role, account_status, created_at, last_login_at")
      .in("id", childParentIds);
    extraProfiles = data ?? [];
  }

  const merged = new Map<
    string,
    {
      id: string;
      full_name: string | null;
      role: "parent" | "coach" | "business_admin" | "admin";
      account_status: "active" | "suspended";
      created_at: string;
      last_login_at: string | null;
    }
  >();
  for (const row of [...(profiles ?? []), ...extraProfiles]) {
    merged.set(row.id, row);
  }

  const userIds = [...merged.keys()];
  const emails = await lookupEmails(userIds);

  const emailMatches: string[] = [];
  for (const [id, email] of emails) {
    if (email.toLowerCase().includes(q)) emailMatches.push(id);
  }

  if (emailMatches.length) {
    const { data } = await service
      .from("profiles")
      .select("id, full_name, role, account_status, created_at, last_login_at")
      .in("id", emailMatches);
    for (const row of data ?? []) merged.set(row.id, row);
  }

  const finalIds = [...merged.keys()].slice(0, SEARCH_LIMIT);
  if (!finalIds.length) return [];

  const { data: childCounts } = await service
    .from("children")
    .select("parent_id")
    .in("parent_id", finalIds);

  const countMap = new Map<string, number>();
  for (const row of childCounts ?? []) {
    const pid = (row as { parent_id: string }).parent_id;
    countMap.set(pid, (countMap.get(pid) ?? 0) + 1);
  }

  const allEmails = await lookupEmails(finalIds);

  return finalIds.map((id) => {
    const row = merged.get(id)!;
    return {
      id: row.id,
      email: allEmails.get(id) ?? "—",
      fullName: row.full_name,
      role: row.role,
      accountStatus: row.account_status,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
      childCount: countMap.get(id) ?? 0,
    };
  });
}

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select(
      "id, full_name, role, account_status, created_at, last_login_at, country, org_id",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const [emails, childCount, subscription, org, audit] = await Promise.all([
    lookupEmails([userId]),
    service
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", userId),
    subscriptionsTable(service)
      .select("sku, status")
      .eq("parent_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    profile.org_id
      ? service
          .from("organizations")
          .select("name")
          .eq("id", profile.org_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    adminAuditLogTable(service)
      .select("id, action, target_type, target_id, metadata, created_at")
      .eq("target_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    id: profile.id,
    email: emails.get(userId) ?? "—",
    fullName: profile.full_name,
    role: profile.role,
    accountStatus: profile.account_status,
    createdAt: profile.created_at,
    lastLoginAt: profile.last_login_at,
    childCount: childCount.count ?? 0,
    country: profile.country,
    orgId: profile.org_id,
    orgName: (org.data as { name: string } | null)?.name ?? null,
    subscriptionSku: (subscription.data as { sku: string } | null)?.sku ?? null,
    subscriptionStatus:
      (subscription.data as { status: string } | null)?.status ?? null,
    recentAudit: (
      (audit.data ?? []) as {
        id: string;
        action: string;
        target_type: string;
        target_id: string;
        metadata: Record<string, unknown>;
        created_at: string;
      }[]
    ).map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    })),
  };
}

export async function suspendUser(
  adminId: string,
  userId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPlatformAdmin(adminId))) return { ok: false, error: "forbidden" };
  const text = reason.trim();
  if (!text) return { ok: false, error: "reason_required" };

  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .update({
      account_status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .neq("role", "admin")
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "not_found" };

  await logAdminAction(adminId, "user_suspend", "user", userId, { reason: text });
  await enqueueJob({
    type: "account_suspend_notify",
    idempotencyKey: `suspend:${userId}:${Date.now()}`,
    payload: { userId, reason: text },
  }).catch(() => undefined);

  return { ok: true };
}

export async function unsuspendUser(
  adminId: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPlatformAdmin(adminId))) return { ok: false, error: "forbidden" };

  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .update({
      account_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "not_found" };

  await logAdminAction(adminId, "user_unsuspend", "user", userId);
  return { ok: true };
}

async function enqueueJob(input: {
  type: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}) {
  const { enqueueJob: enqueue } = await import("@/lib/jobs/queue");
  return enqueue(input);
}

export async function searchAdminBusinesses(
  query: string,
): Promise<AdminBusinessListItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const service = createServiceClient();
  const { data: orgs } = await service
    .from("organizations")
    .select(
      "id, name, public_slug, org_type, trial_started_at, onboarding_completed_at, public_page_enabled, verified_badge",
    )
    .or(`name.ilike.%${q}%,public_slug.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);

  const rows = orgs ?? [];
  if (!rows.length) return [];

  const orgIds = rows.map((o: { id: string }) => o.id);

  const [{ data: programs }, { data: subs }, { data: directors }] =
    await Promise.all([
      service.from("programs").select("org_id").in("org_id", orgIds),
      subscriptionsTable(service)
        .select("org_id, status")
        .in("org_id", orgIds)
        .in("status", [...ACTIVE_SUBSCRIPTION_STATUSES]),
      service
        .from("org_members")
        .select("org_id, user_id")
        .in("org_id", orgIds)
        .eq("role", "director")
        .is("deactivated_at", null),
    ]);

  const programCounts = new Map<string, number>();
  for (const p of programs ?? []) {
    const oid = (p as { org_id: string }).org_id;
    programCounts.set(oid, (programCounts.get(oid) ?? 0) + 1);
  }

  const subMap = new Map<string, string>();
  for (const s of subs ?? []) {
    subMap.set((s as { org_id: string }).org_id, (s as { status: string }).status);
  }

  const directorMap = new Map<string, string>();
  for (const d of directors ?? []) {
    directorMap.set(
      (d as { org_id: string }).org_id,
      (d as { user_id: string }).user_id,
    );
  }

  const directorEmails = await lookupEmails([...directorMap.values()]);

  return rows.map(
    (row: {
      id: string;
      name: string;
      public_slug: string;
      org_type: string;
      trial_started_at: string | null;
      onboarding_completed_at: string | null;
      public_page_enabled: boolean;
      verified_badge: boolean;
    }) => {
      const directorId = directorMap.get(row.id);
      return {
        id: row.id,
        name: row.name,
        publicSlug: row.public_slug,
        orgType: row.org_type,
        trialStartedAt: row.trial_started_at,
        onboardingCompletedAt: row.onboarding_completed_at,
        publicPageEnabled: row.public_page_enabled,
        verifiedBadge: row.verified_badge,
        programCount: programCounts.get(row.id) ?? 0,
        subscriptionStatus: subMap.get(row.id) ?? null,
        directorEmail: directorId ? directorEmails.get(directorId) ?? null : null,
      };
    },
  );
}

export async function getAdminBusinessDetail(
  orgId: string,
): Promise<AdminBusinessDetail | null> {
  const service = createServiceClient();
  const { data: org } = await service
    .from("organizations")
    .select(
      "id, name, public_slug, org_type, trial_started_at, onboarding_completed_at, public_page_enabled, verified_badge, city, region, country, internal_notes, stripe_connect_onboarded_at",
    )
    .eq("id", orgId)
    .maybeSingle();

  if (!org) return null;

  const list = await searchAdminBusinesses(org.name);
  const summary = list.find((b) => b.id === orgId);

  return {
    id: org.id,
    name: org.name,
    publicSlug: org.public_slug,
    orgType: org.org_type,
    trialStartedAt: org.trial_started_at,
    onboardingCompletedAt: org.onboarding_completed_at,
    publicPageEnabled: org.public_page_enabled,
    verifiedBadge: org.verified_badge,
    programCount: summary?.programCount ?? 0,
    subscriptionStatus: summary?.subscriptionStatus ?? null,
    directorEmail: summary?.directorEmail ?? null,
    city: org.city,
    region: org.region,
    country: org.country,
    stripeConnectOnboarded: Boolean(org.stripe_connect_onboarded_at),
    internalNotes: org.internal_notes,
  };
}

export async function getAdminAnalytics(
  rangeDays = 30,
): Promise<AdminAnalyticsSnapshot> {
  const service = createServiceClient();
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

  const [
    newParents,
    newBusinesses,
    consultVolume,
    familyConversions,
    proConversions,
    engagement,
    consults,
    parentCreations,
  ] = await Promise.all([
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "parent")
      .gte("created_at", since),
    service
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    service
      .from("incident_consults" as "profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    subscriptionsTable(service)
      .select("id", { count: "exact", head: true })
      .eq("sku", SUBSCRIPTION_SKUS.parentFamily)
      .gte("created_at", since),
    subscriptionsTable(service)
      .select("id", { count: "exact", head: true })
      .eq("sku", SUBSCRIPTION_SKUS.businessPro)
      .gte("created_at", since),
    engagementTable(service)
      .select("event_type, created_at")
      .gte("created_at", since),
    service
      .from("incident_consults" as "profiles")
      .select("created_at")
      .gte("created_at", since),
    service
      .from("profiles")
      .select("created_at")
      .eq("role", "parent")
      .gte("created_at", since),
  ]);

  const engagementRows = (engagement.data ?? []) as {
    event_type: string;
    created_at: string;
  }[];
  const opens = engagementRows.filter((e) => e.event_type === "report_open").length;
  const reads = engagementRows.filter((e) => e.event_type === "report_read").length;
  const reportOpenRatePercent =
    opens > 0 ? Math.round((reads / opens) * 100) : null;

  const bucketByDay = (rows: { created_at: string }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const day = row.created_at.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  };

  return {
    rangeDays,
    newParents: newParents.count ?? 0,
    newBusinesses: newBusinesses.count ?? 0,
    consultVolume: consultVolume.count ?? 0,
    reportOpenRatePercent,
    familyConversions: familyConversions.count ?? 0,
    proConversions: proConversions.count ?? 0,
    dailyActivations: bucketByDay(
      (parentCreations.data ?? []) as { created_at: string }[],
    ),
    dailyConsults: bucketByDay(
      (consults.data ?? []) as { created_at: string }[],
    ),
  };
}

export async function listModerationFlags(): Promise<ModerationFlagItem[]> {
  const service = createServiceClient();
  const { data } = await reportChildrenTable(service)
    .select(
      "id, mentioned_name, status, misassigned_flag, updated_at, daily_report_id",
    )
    .or("status.eq.flagged,misassigned_flag.eq.true")
    .neq("status", "skipped")
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as {
    id: string;
    mentioned_name: string | null;
    status: string;
    misassigned_flag: boolean;
    updated_at: string;
    daily_report_id: string;
  }[];

  if (!rows.length) return [];

  const reportIds = [...new Set(rows.map((r) => r.daily_report_id))];
  const { data: reports } = await service
    .from("daily_reports" as "program_registrations")
    .select("id, org_id, program_id")
    .in("id", reportIds);

  const reportMap = new Map(
    (reports ?? []).map((r: { id: string; org_id: string; program_id: string }) => [
      r.id,
      r,
    ]),
  );

  const orgIds = [...new Set((reports ?? []).map((r: { org_id: string }) => r.org_id))];
  const programIds = [
    ...new Set((reports ?? []).map((r: { program_id: string }) => r.program_id)),
  ];

  const [{ data: orgs }, { data: programs }] = await Promise.all([
    service.from("organizations").select("id, name").in("id", orgIds),
    service.from("programs").select("id, name").in("id", programIds),
  ]);

  const orgNameMap = new Map(
    (orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]),
  );
  const programNameMap = new Map(
    (programs ?? []).map((p: { id: string; name: string }) => [p.id, p.name]),
  );

  return rows.map((row) => {
    const report = reportMap.get(row.daily_report_id);
    return {
      id: row.id,
      reportChildId: row.id,
      childName: row.mentioned_name ?? "Unknown child",
      orgName: report ? orgNameMap.get(report.org_id) ?? "—" : "—",
      programName: report ? programNameMap.get(report.program_id) ?? null : null,
      reason: row.misassigned_flag
        ? "Misassigned mention flagged"
        : "Report flagged for review",
      flaggedAt: row.updated_at,
      status: row.status,
    };
  });
}

export async function resolveModerationFlag(
  adminId: string,
  reportChildId: string,
  action: "dismiss" | "confirm",
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPlatformAdmin(adminId))) return { ok: false, error: "forbidden" };

  const service = createServiceClient();
  const patch =
    action === "dismiss"
      ? { status: "draft", misassigned_flag: false }
      : { status: "skipped", misassigned_flag: false };

  const { data, error } = await reportChildrenTable(service)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", reportChildId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "not_found" };

  await logAdminAction(adminId, `moderation_${action}`, "report_child", reportChildId);
  return { ok: true };
}

export async function listSlugDisputes(
  status?: "open" | "resolved" | "rejected",
): Promise<SlugDisputeItem[]> {
  const service = createServiceClient();
  let query = slugDisputesTable(service)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);

  const { data } = await query;
  const rows = (data ?? []) as {
    id: string;
    org_id: string;
    disputed_slug: string;
    holder_org_id: string | null;
    reason: string;
    status: SlugDisputeItem["status"];
    granted_slug: string | null;
    resolution_notes: string | null;
    created_at: string;
    resolved_at: string | null;
  }[];

  if (!rows.length) return [];

  const orgIds = [
    ...new Set([
      ...rows.map((r) => r.org_id),
      ...rows.map((r) => r.holder_org_id).filter(Boolean),
    ]),
  ] as string[];

  const { data: orgs } = await service
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);

  const orgNameMap = new Map(
    (orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]),
  );

  return rows.map((row) => ({
    id: row.id,
    orgId: row.org_id,
    orgName: orgNameMap.get(row.org_id) ?? "—",
    disputedSlug: row.disputed_slug,
    holderOrgId: row.holder_org_id,
    holderOrgName: row.holder_org_id
      ? orgNameMap.get(row.holder_org_id) ?? null
      : null,
    reason: row.reason,
    status: row.status,
    grantedSlug: row.granted_slug,
    resolutionNotes: row.resolution_notes,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}

export async function resolveSlugDispute(
  adminId: string,
  disputeId: string,
  input: ResolveSlugDisputeInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPlatformAdmin(adminId))) return { ok: false, error: "forbidden" };

  const service = createServiceClient();
  const { data: dispute } = await slugDisputesTable(service)
    .select("*")
    .eq("id", disputeId)
    .eq("status", "open")
    .maybeSingle();

  if (!dispute) return { ok: false, error: "not_found" };

  const now = new Date().toISOString();

  if (input.action === "reject") {
    await slugDisputesTable(service)
      .update({
        status: "rejected",
        resolution_notes: input.resolutionNotes?.trim() || null,
        resolved_by: adminId,
        resolved_at: now,
        updated_at: now,
      })
      .eq("id", disputeId);

    await logAdminAction(adminId, "slug_reject", "slug_dispute", disputeId, {
      notes: input.resolutionNotes,
    });
    return { ok: true };
  }

  const grantedSlug = (input.grantedSlug ?? dispute.disputed_slug).trim();
  if (!/^[a-z0-9-]{3,40}$/.test(grantedSlug)) {
    return { ok: false, error: "invalid_slug" };
  }

  const { data: taken } = await service
    .from("organizations")
    .select("id")
    .eq("public_slug", grantedSlug)
    .neq("id", dispute.org_id)
    .maybeSingle();

  if (taken && input.action === "grant" && taken.id !== dispute.holder_org_id) {
    return { ok: false, error: "slug_taken" };
  }

  if (input.action === "grant" && dispute.holder_org_id) {
    const fallbackSlug = `${grantedSlug}-org-${dispute.holder_org_id.slice(0, 6)}`;
    await service
      .from("organizations")
      .update({
        public_slug: fallbackSlug,
        updated_at: now,
      })
      .eq("id", dispute.holder_org_id);
  }

  await service
    .from("organizations")
    .update({
      public_slug: grantedSlug,
      updated_at: now,
    })
    .eq("id", dispute.org_id);

  await slugDisputesTable(service)
    .update({
      status: "resolved",
      granted_slug: grantedSlug,
      resolution_notes: input.resolutionNotes?.trim() || null,
      resolved_by: adminId,
      resolved_at: now,
      updated_at: now,
    })
    .eq("id", disputeId);

  await logAdminAction(adminId, "slug_resolve", "slug_dispute", disputeId, {
    grantedSlug,
    action: input.action,
  });

  return { ok: true };
}

export async function recordImpersonateView(
  adminId: string,
  userId: string,
): Promise<void> {
  if (!(await isPlatformAdmin(adminId))) return;
  await logAdminAction(adminId, "impersonate_view", "user", userId, {
    mode: "read_only",
  });
}

export async function fileSlugDispute(
  userId: string,
  orgId: string,
  disputedSlug: string,
  reason: string,
): Promise<{ ok: boolean; error?: string; disputeId?: string }> {
  const text = reason.trim();
  if (!text) return { ok: false, error: "reason_required" };
  if (!/^[a-z0-9-]{3,40}$/.test(disputedSlug)) {
    return { ok: false, error: "invalid_slug" };
  }

  const service = createServiceClient();
  const { data: member } = await service
    .from("org_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("role", "director")
    .is("deactivated_at", null)
    .maybeSingle();

  if (!member) return { ok: false, error: "forbidden" };

  const { data: holder } = await service
    .from("organizations")
    .select("id")
    .eq("public_slug", disputedSlug)
    .neq("id", orgId)
    .maybeSingle();

  const now = new Date().toISOString();
  const { data, error } = await slugDisputesTable(service)
    .insert({
      org_id: orgId,
      disputed_slug: disputedSlug,
      holder_org_id: holder?.id ?? null,
      reason: text,
      status: "open",
      created_by: userId,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "create_failed" };
  return { ok: true, disputeId: data.id as string };
}
