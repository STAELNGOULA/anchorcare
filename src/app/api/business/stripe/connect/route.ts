import { NextResponse } from "next/server";
import { getDirectorOrgId, isDirectorOfOrg } from "@/lib/business/org-profile-service";
import {
  createStripeConnectOnboardingLink,
  getOrgStripeConnectStatus,
  isStripeConfigured,
} from "@/lib/stripe/connect";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId || !(await isDirectorOfOrg(user.id, orgId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const status = await getOrgStripeConnectStatus(orgId);
  return NextResponse.json({
    ok: true,
    configured: isStripeConfigured(),
    ...status,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId || !(await isDirectorOfOrg(user.id, orgId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name, country")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  let body: { returnUrl?: string; refreshUrl?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* optional body */
  }

  const origin = new URL(request.url).origin;
  const returnUrl = body.returnUrl ?? `${origin}/business/programs?connect=return`;
  const refreshUrl = body.refreshUrl ?? `${origin}/business/programs?connect=refresh`;

  const result = await createStripeConnectOnboardingLink({
    orgId,
    orgName: org.name,
    country: org.country as "US" | "CA",
    returnUrl,
    refreshUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: result.url });
}
