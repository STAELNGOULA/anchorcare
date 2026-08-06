import Stripe from "stripe";
import type { StripeConnectStatus } from "@/lib/business/program-types";
import { createServiceClient } from "@/lib/supabase/service";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function getOrgStripeConnectStatus(
  orgId: string,
): Promise<StripeConnectStatus> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("stripe_connect_account_id, stripe_connect_onboarded_at")
    .eq("id", orgId)
    .maybeSingle();

  const accountId = data?.stripe_connect_account_id ?? null;
  const onboarded = Boolean(data?.stripe_connect_onboarded_at);

  if (!accountId || !getStripe()) {
    return { accountId, onboarded, chargesEnabled: onboarded };
  }

  try {
    const account = await getStripe()!.accounts.retrieve(accountId);
    const chargesEnabled = Boolean(account.charges_enabled);
    if (chargesEnabled && !onboarded) {
      await supabase
        .from("organizations")
        .update({
          stripe_connect_onboarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);
    }
    return { accountId, onboarded: onboarded || chargesEnabled, chargesEnabled };
  } catch {
    return { accountId, onboarded, chargesEnabled: onboarded };
  }
}

export async function createStripeConnectOnboardingLink(input: {
  orgId: string;
  orgName: string;
  country: "US" | "CA";
  returnUrl: string;
  refreshUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, code: "stripeNotConfigured" };

  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_connect_account_id")
    .eq("id", input.orgId)
    .maybeSingle();

  let accountId = org?.stripe_connect_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: input.country,
      business_profile: { name: input.orgName },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await supabase
      .from("organizations")
      .update({
        stripe_connect_account_id: accountId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.orgId);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: "account_onboarding",
  });

  return { ok: true, url: link.url };
}
