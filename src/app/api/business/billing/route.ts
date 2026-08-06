import { NextResponse } from "next/server";
import { getBusinessBillingSummary } from "@/lib/billing/billing-service";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import {
  createBillingPortalSession,
  createBusinessProCheckout,
} from "@/lib/stripe/subscriptions";
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
  if (!orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const summary = await getBusinessBillingSummary(orgId);
  return NextResponse.json(summary);
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
  if (!orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { action?: "checkout" | "portal" };
  const summary = await getBusinessBillingSummary(orgId);

  if (body.action === "checkout") {
    const result = await createBusinessProCheckout({
      orgId,
      email: user.email ?? "",
      orgName: summary.orgName,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  }

  if (body.action === "portal") {
    const customerId = summary.entitlements.subscription?.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ error: "noCustomer" }, { status: 400 });
    }
    const result = await createBillingPortalSession({
      customerId,
      returnPath: "/business/settings/billing",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  }

  return NextResponse.json({ error: "badRequest" }, { status: 400 });
}
