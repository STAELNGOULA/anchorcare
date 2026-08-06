import { NextResponse } from "next/server";
import {
  clearPickupEta,
  setPickupEta,
} from "@/lib/pickups/pickup-eta-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    childId?: string;
    minutesLate?: number;
    note?: string | null;
  };

  if (!body.childId || typeof body.minutesLate !== "number") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await setPickupEta(user.id, {
    childId: body.childId,
    minutesLate: body.minutesLate,
    note: body.note,
  });

  if (!result.ok) {
    const status =
      result.error === "notFound"
        ? 404
        : result.error === "noEnrollment"
          ? 400
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, eta: result.eta });
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

  const result = await clearPickupEta(user.id, childId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
