import { NextResponse } from "next/server";
import {
  listProductsForDirector,
  createProduct,
} from "@/lib/marketplace/marketplace-service";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  priceCents: z.number().int().positive(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const products = await listProductsForDirector(orgId);
  return NextResponse.json({ ok: true, products });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validationError" }, { status: 400 });

  const result = await createProduct(orgId, parsed.data);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, product: result });
}
