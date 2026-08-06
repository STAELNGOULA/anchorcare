import { NextResponse } from "next/server";
import {
  createPromoCode,
  listPromoCodesForOrg,
  updatePromoCode,
} from "@/lib/registrations/promo-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().trim().min(2).max(40),
  programId: z.string().uuid().optional().nullable(),
  discountType: z.enum(["percent", "fixed_cents"]),
  discountValue: z.number().int().positive(),
  siblingOnly: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const promos = await listPromoCodesForOrg(orgId);
  return NextResponse.json({ ok: true, promos });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const result = await createPromoCode(orgId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, promo: result });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    promoId?: string;
    active?: boolean;
    maxUses?: number | null;
  };

  if (!body.promoId) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  const ok = await updatePromoCode(orgId, body.promoId, {
    active: body.active,
    maxUses: body.maxUses,
  });

  if (!ok) return NextResponse.json({ error: "updateFailed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
