import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  FREE_CHILD_LIMIT,
  SUBSCRIPTION_SKUS,
  TRIAL_DAYS,
} from "@/lib/billing/billing-constants";
import type {
  OrgEntitlements,
  ParentEntitlements,
  SubscriptionRecord,
  SubscriptionStatus,
} from "@/lib/billing/billing-types";
import type { ParentPlan } from "@/lib/parent/parent-context";
import { createServiceClient } from "@/lib/supabase/service";

type SubscriptionRow = {
  id: string;
  sku: string;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subscriptionsTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("subscriptions" as "profiles");
}

function mapRow(row: SubscriptionRow): SubscriptionRecord {
  return {
    id: row.id,
    sku: row.sku as SubscriptionRecord["sku"],
    status: row.status,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEnd: row.trial_end,
  };
}

function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export async function getParentSubscription(
  parentId: string,
): Promise<SubscriptionRecord | null> {
  const service = createServiceClient();
  const { data } = await subscriptionsTable(service)
    .select(
      "id, sku, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, trial_end",
    )
    .eq("parent_id", parentId)
    .eq("sku", SUBSCRIPTION_SKUS.parentFamily)
    .maybeSingle();

  if (!data) return null;
  return mapRow(data as SubscriptionRow);
}

export async function getOrgSubscription(
  orgId: string,
): Promise<SubscriptionRecord | null> {
  const service = createServiceClient();
  const { data } = await subscriptionsTable(service)
    .select(
      "id, sku, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, trial_end",
    )
    .eq("org_id", orgId)
    .eq("sku", SUBSCRIPTION_SKUS.businessPro)
    .maybeSingle();

  if (!data) return null;
  return mapRow(data as SubscriptionRow);
}

export async function resolveParentPlan(parentId: string): Promise<ParentPlan> {
  const subscription = await getParentSubscription(parentId);
  if (subscription && isSubscriptionActive(subscription.status)) {
    return "family";
  }
  return "free";
}

export async function getParentEntitlements(
  parentId: string,
  childrenCount = 0,
): Promise<ParentEntitlements> {
  const subscription = await getParentSubscription(parentId);
  const familyActive =
    subscription !== null && isSubscriptionActive(subscription.status);
  const plan: ParentPlan = familyActive ? "family" : "free";

  return {
    plan,
    canAccessFullTimeline: familyActive,
    canAccessCare: familyActive,
    canAddChild: familyActive || childrenCount < FREE_CHILD_LIMIT,
    maxChildren: familyActive ? 99 : FREE_CHILD_LIMIT,
    subscription,
  };
}

export async function getOrgEntitlements(orgId: string): Promise<OrgEntitlements> {
  const service = createServiceClient();
  const { data: org } = await service
    .from("organizations")
    .select("trial_started_at, created_at")
    .eq("id", orgId)
    .maybeSingle();

  const trialStart = org?.trial_started_at ?? org?.created_at ?? new Date().toISOString();
  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const trialActive = trialDaysLeft > 0;

  const subscription = await getOrgSubscription(orgId);
  const proActive =
    subscription !== null && isSubscriptionActive(subscription.status);
  const canPublish = trialActive || proActive;

  return {
    trialActive,
    trialDaysLeft,
    proActive,
    canPublish,
    canUseVoiceAi: canPublish,
    subscription,
  };
}
