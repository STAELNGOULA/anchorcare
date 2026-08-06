import { NextResponse } from "next/server";
import { getOrCreateParentReferralCode } from "@/lib/referrals/referral-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await getOrCreateParentReferralCode(user.id);
  return NextResponse.json({ ok: true, profile });
}
