import { NextResponse } from "next/server";
import { getParentBillingSummary } from "@/lib/billing/billing-service";
import {
  createBillingPortalSession,
  createParentFamilyCheckout,
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

  const { count } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", user.id);

  const summary = await getParentBillingSummary(user.id, count ?? 0);
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

  const body = (await request.json()) as { action?: "checkout" | "portal" };

  if (body.action === "checkout") {
    const result = await createParentFamilyCheckout({
      parentId: user.id,
      email: user.email ?? "",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  }

  if (body.action === "portal") {
    const summary = await getParentBillingSummary(user.id, 0);
    const customerId = summary.entitlements.subscription?.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ error: "noCustomer" }, { status: 400 });
    }
    const result = await createBillingPortalSession({
      customerId,
      returnPath: "/parent/you/subscription",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  }

  return NextResponse.json({ error: "badRequest" }, { status: 400 });
}
