import { NextResponse } from "next/server";
import {
  createAuthorizedPickup,
  listParentPickupChildren,
} from "@/lib/pickups/pickup-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const children = await listParentPickupChildren(user.id);
  return NextResponse.json({ children });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    childId?: string;
    name?: string;
    relation?: string;
    phone?: string;
  };

  if (!body.childId || !body.name?.trim() || !body.relation?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await createAuthorizedPickup(user.id, {
    childId: body.childId,
    name: body.name,
    relation: body.relation,
    phone: body.phone,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, pickup: result.pickup });
}
