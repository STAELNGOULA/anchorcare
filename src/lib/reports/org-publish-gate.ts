import { getOrgEntitlements } from "@/lib/billing/entitlements";

export type PublishGateResult =
  | { ok: true; trialActive: boolean; proActive: boolean }
  | { ok: false; error: string; code: "trial_lapsed" };

export async function assertOrgCanPublish(
  orgId: string,
): Promise<PublishGateResult> {
  const entitlements = await getOrgEntitlements(orgId);

  if (!entitlements.canPublish) {
    return {
      ok: false,
      error: "Trial ended — upgrade billing to publish reports",
      code: "trial_lapsed",
    };
  }

  return {
    ok: true,
    trialActive: entitlements.trialActive,
    proActive: entitlements.proActive,
  };
}
