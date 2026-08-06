import { NextResponse } from "next/server";
import { getOrCreateBusinessReferralCode } from "@/lib/referrals/referral-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await getOrCreateBusinessReferralCode(user.id);
  if ("error" in profile) {
    return NextResponse.json({ error: profile.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true, profile });
}
