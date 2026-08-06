/**
 * Entitlements gate premium features before Stripe billing (Phase 29).
 * Stub returns conservative defaults until subscriptions are wired.
 */

export type EntitlementFeature =
  | "timeline_full"
  | "care_doctors"
  | "care_visits"
  | "care_consults"
  | "sms_reports"
  | "photo_gallery";

export type EntitlementContext = {
  userId: string;
  orgId?: string | null;
};

export type EntitlementResult = {
  allowed: boolean;
  reason?: "trial" | "subscription" | "staff_override" | "denied";
};

const STUB_DEFAULTS: Record<EntitlementFeature, boolean> = {
  timeline_full: true,
  care_doctors: false,
  care_visits: false,
  care_consults: false,
  sms_reports: true,
  photo_gallery: true,
};

/**
 * Check whether a user may access a gated feature.
 * Phase 29 replaces this with Stripe-backed subscription lookups.
 */
export async function checkEntitlement(
  feature: EntitlementFeature,
  _context: EntitlementContext,
): Promise<EntitlementResult> {
  const allowed = STUB_DEFAULTS[feature] ?? false;
  return {
    allowed,
    reason: allowed ? "trial" : "denied",
  };
}

/** Server-side 7-day window for free parents — see report-detail-service. */
export function isFreeReportHistoryDate(reportDate: string): boolean {
  const reportMs = new Date(`${reportDate}T12:00:00`).getTime();
  return Date.now() - reportMs <= 7 * 24 * 60 * 60 * 1000;
}

export async function requireEntitlement(
  feature: EntitlementFeature,
  context: EntitlementContext,
): Promise<void> {
  const result = await checkEntitlement(feature, context);
  if (!result.allowed) {
    throw new Error(`Entitlement denied: ${feature}`);
  }
}
