export const TRIAL_DAYS = 14;

export const FREE_CHILD_LIMIT = 1;

export const SUBSCRIPTION_SKUS = {
  parentFamily: "parent_family",
  businessPro: "business_pro",
} as const;

export type SubscriptionSku =
  (typeof SUBSCRIPTION_SKUS)[keyof typeof SUBSCRIPTION_SKUS];

export const ACTIVE_SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
] as const;

export const SUBSCRIPTION_MRR_CENTS = {
  parent_family: 1299,
  business_pro: 9900,
} as const;
