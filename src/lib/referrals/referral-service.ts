import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

function generateCode(prefix: string): string {
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attributionsTable(client: { from: (t: string) => any }) {
  return client.from("referral_attributions" as "organizations");
}

export type ReferralProfile = {
  code: string;
  shareUrl: string;
  rewardDescription: string;
  attributionsCount: number;
};

export async function getOrCreateParentReferralCode(userId: string): Promise<ReferralProfile> {
  const service = createServiceClient();
  const { data: profileRow } = await service
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const profile = profileRow as { referral_code?: string | null } | null;
  let code = profile?.referral_code ?? null;

  if (!code) {
    code = generateCode("P");
    await service
      .from("profiles")
      .update({ referral_code: code } as never)
      .eq("id", userId);
  }

  const { count } = await attributionsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("referrer_type", "parent");

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  return {
    code,
    shareUrl: `${base}/sign-up/parent?ref=${encodeURIComponent(code)}`,
    rewardDescription: "parent_month_free",
    attributionsCount: count ?? 0,
  };
}

export async function getOrCreateBusinessReferralCode(
  userId: string,
): Promise<ReferralProfile | { error: string }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "business_admin" || !profile.org_id) {
    return { error: "forbidden" };
  }

  const service = createServiceClient();
  const { data: orgRow } = await service
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .maybeSingle();

  const org = orgRow as { referral_code?: string | null; public_slug?: string } | null;
  let code = org?.referral_code ?? null;
  if (!code) {
    code = generateCode("B");
    await service
      .from("organizations")
      .update({ referral_code: code } as never)
      .eq("id", profile.org_id);
  }

  const { count } = await attributionsTable(service)
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", profile.org_id)
    .eq("referrer_type", "business");

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  return {
    code,
    shareUrl: `${base}/sign-up/business?ref=${encodeURIComponent(code)}`,
    rewardDescription: "business_trial_extension",
    attributionsCount: count ?? 0,
  };
}

export async function recordReferralAttribution(input: {
  referredUserId: string;
  referralCode: string;
}): Promise<void> {
  const code = input.referralCode.trim().toUpperCase();
  if (!code) return;

  const service = createServiceClient();

  const { data: parentProfile } = await service
    .from("profiles")
    .select("id")
    .eq("referral_code" as "id", code)
    .maybeSingle();

  if (parentProfile) {
    await attributionsTable(service).upsert(
      {
        referrer_type: "parent",
        referrer_id: parentProfile.id,
        referred_user_id: input.referredUserId,
        referral_code: code,
        reward_status: "pending",
      } as never,
      { onConflict: "referred_user_id", ignoreDuplicates: true },
    );
    return;
  }

  const { data: org } = await service
    .from("organizations")
    .select("id")
    .eq("referral_code" as "id", code)
    .maybeSingle();

  if (org) {
    await attributionsTable(service).upsert(
      {
        referrer_type: "business",
        referrer_id: org.id,
        referred_user_id: input.referredUserId,
        referral_code: code,
        reward_status: "pending",
      } as never,
      { onConflict: "referred_user_id", ignoreDuplicates: true },
    );
  }
}
