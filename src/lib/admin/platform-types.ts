export type PlatformHealth = {
  pendingJobs: number;
  failedJobs: number;
  smsFailureRatePercent: number | null;
};

export type PlatformDashboardKpis = {
  mrrCents: number;
  mrrDisplay: string;
  activeBusinesses: number;
  activeParents: number;
  weeklyActivations: number;
  waporPercent: number | null;
  pendingConsults: number;
  openSlugDisputes: number;
  flaggedReports: number;
  health: PlatformHealth;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  accountStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
  childCount: number;
};

export type AdminUserDetail = AdminUserListItem & {
  country: string | null;
  orgId: string | null;
  orgName: string | null;
  subscriptionSku: string | null;
  subscriptionStatus: string | null;
  recentAudit: AdminAuditEntry[];
};

export type AdminBusinessListItem = {
  id: string;
  name: string;
  publicSlug: string;
  orgType: string;
  trialStartedAt: string | null;
  onboardingCompletedAt: string | null;
  publicPageEnabled: boolean;
  verifiedBadge: boolean;
  programCount: number;
  subscriptionStatus: string | null;
  directorEmail: string | null;
};

export type AdminBusinessDetail = AdminBusinessListItem & {
  city: string | null;
  region: string | null;
  country: string | null;
  stripeConnectOnboarded: boolean;
  internalNotes: string | null;
};

export type AdminAnalyticsSnapshot = {
  rangeDays: number;
  newParents: number;
  newBusinesses: number;
  consultVolume: number;
  reportOpenRatePercent: number | null;
  familyConversions: number;
  proConversions: number;
  dailyActivations: { date: string; count: number }[];
  dailyConsults: { date: string; count: number }[];
};

export type ModerationFlagItem = {
  id: string;
  reportChildId: string;
  childName: string;
  orgName: string;
  programName: string | null;
  reason: string;
  flaggedAt: string;
  status: string;
};

export type SlugDisputeItem = {
  id: string;
  orgId: string;
  orgName: string;
  disputedSlug: string;
  holderOrgId: string | null;
  holderOrgName: string | null;
  reason: string;
  status: "open" | "resolved" | "rejected";
  grantedSlug: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type AdminAuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ResolveSlugDisputeInput = {
  action: "grant" | "reject" | "reassign";
  grantedSlug?: string;
  resolutionNotes?: string;
};

export type SuspendUserInput = {
  reason: string;
};
