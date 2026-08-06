import { calculatePlatformFeeCents } from "@/lib/registrations/pricing-service";
import { createConnectCheckoutSession } from "@/lib/stripe/checkout";
import { getSiteUrl } from "@/lib/public/json-ld";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type MarketplaceProduct = {
  id: string;
  orgId: string;
  orgName?: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  imagePath: string | null;
  active: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function productsTable(client: { from: (t: string) => any }) {
  return client.from("marketplace_products" as "organizations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ordersTable(client: { from: (t: string) => any }) {
  return client.from("marketplace_orders" as "organizations");
}

export async function listProductsForDirector(orgId: string): Promise<MarketplaceProduct[]> {
  const supabase = await createClient();
  const { data } = await productsTable(supabase)
    .select("id, org_id, name, description, price_cents, currency, image_path, active")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    priceCents: Number(row.price_cents),
    currency: String(row.currency ?? "usd"),
    imagePath: (row.image_path as string | null) ?? null,
    active: Boolean(row.active),
  }));
}

export async function listProductsForParent(parentId: string): Promise<MarketplaceProduct[]> {
  const supabase = await createClient();
  const { data } = await productsTable(supabase)
    .select(
      "id, org_id, name, description, price_cents, currency, image_path, active, organizations(name)",
    )
    .eq("active", true)
    .order("name");

  return (data ?? []).map((row: Record<string, unknown>) => {
    const org = row.organizations as { name: string } | null;
    return {
      id: String(row.id),
      orgId: String(row.org_id),
      orgName: org?.name,
      name: String(row.name),
      description: (row.description as string | null) ?? null,
      priceCents: Number(row.price_cents),
      currency: String(row.currency ?? "usd"),
      imagePath: (row.image_path as string | null) ?? null,
      active: Boolean(row.active),
    };
  });
}

export async function createProduct(
  orgId: string,
  input: {
    name: string;
    description?: string;
    priceCents: number;
    currency?: string;
  },
): Promise<MarketplaceProduct | { error: string }> {
  const service = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await productsTable(service)
    .insert({
      org_id: orgId,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      price_cents: input.priceCents,
      currency: input.currency ?? "usd",
      active: true,
      created_at: now,
      updated_at: now,
    })
    .select("id, org_id, name, description, price_cents, currency, image_path, active")
    .single();

  if (error || !data) return { error: "save_failed" };

  return {
    id: data.id,
    orgId: data.org_id,
    name: data.name,
    description: data.description,
    priceCents: data.price_cents,
    currency: data.currency,
    imagePath: data.image_path,
    active: data.active,
  };
}

export async function startMarketplaceCheckout(
  parentId: string,
  parentEmail: string,
  productId: string,
  quantity = 1,
): Promise<{ ok: true; checkoutUrl: string } | { ok: false; code: string }> {
  const supabase = await createClient();
  const { data: product } = await productsTable(supabase)
    .select("id, org_id, name, price_cents, currency, active")
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle();

  if (!product) return { ok: false, code: "notFound" };

  const totalCents = product.price_cents * quantity;
  const platformFeeCents = calculatePlatformFeeCents(totalCents);
  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: order, error: orderError } = await ordersTable(service)
    .insert({
      org_id: product.org_id,
      parent_id: parentId,
      status: "pending",
      total_cents: totalCents,
      currency: product.currency,
      platform_fee_cents: platformFeeCents,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (orderError || !order) return { ok: false, code: "orderFailed" };

  await service.from("marketplace_order_items").insert({
    order_id: order.id,
    product_id: product.id,
    quantity,
    price_cents: product.price_cents,
  });

  const { data: org } = await service
    .from("organizations")
    .select("public_slug")
    .eq("id", product.org_id)
    .maybeSingle();

  const siteUrl = getSiteUrl();
  const checkout = await createConnectCheckoutSession({
    orgId: product.org_id,
    amountCents: totalCents,
    platformFeeCents,
    currency: product.currency,
    productName: product.name,
    parentEmail,
    successUrl: `${siteUrl}/parent/you/marketplace?paid=1`,
    cancelUrl: `${siteUrl}/parent/you/marketplace?checkout=cancelled`,
    metadata: {
      org_id: product.org_id,
      org_slug: org?.public_slug ?? "",
      source: "marketplace",
      marketplace_order_id: order.id,
      platform_fee_cents: String(platformFeeCents),
    },
    marketplaceOrderId: order.id,
  });

  if (!checkout.ok) return { ok: false, code: checkout.code };
  return { ok: true, checkoutUrl: checkout.url };
}
