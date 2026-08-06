import { NextResponse } from "next/server";
import { startMarketplaceCheckout } from "@/lib/marketplace/marketplace-service";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validationError" }, { status: 400 });

  const result = await startMarketplaceCheckout(
    user.id,
    user.email,
    parsed.data.productId,
    parsed.data.quantity ?? 1,
  );

  if (!result.ok) return NextResponse.json({ error: result.code }, { status: 400 });
  return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl });
}
