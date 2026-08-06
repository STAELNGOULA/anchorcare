import { NextResponse } from "next/server";
import {
  clearPickupOverride,
  setPickupOverride,
} from "@/lib/pickups/pickup-service";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    childId?: string;
    personName?: string;
    note?: string | null;
    untilTime?: string | null;
    timezone?: string;
    authorizedPickupId?: string | null;
  };

  if (!body.childId || !body.personName?.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await setPickupOverride(user.id, {
    childId: body.childId,
    personName: body.personName,
    note: body.note,
    untilTime: body.untilTime,
    timezone: body.timezone ?? "UTC",
    authorizedPickupId: body.authorizedPickupId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, override: result.override });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const childId = new URL(request.url).searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await clearPickupOverride(user.id, childId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
