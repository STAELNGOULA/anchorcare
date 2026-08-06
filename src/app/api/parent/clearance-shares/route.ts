import { NextResponse } from "next/server";
import {
  createClearanceShare,
  listParentClearanceEnrollments,
  listParentClearanceHistory,
} from "@/lib/clearance/clearance-share-service";
import type { CreateClearanceShareInput } from "@/lib/clearance/clearance-types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [enrollments, history] = await Promise.all([
    listParentClearanceEnrollments(user.id),
    listParentClearanceHistory(user.id),
  ]);

  return NextResponse.json({ ok: true, enrollments, history });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateClearanceShareInput;
  const result = await createClearanceShare(user.id, body);

  if ("error" in result) {
    const status =
      result.error === "expiry_in_past" || result.error === "invalid_summary"
        ? 422
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, shareId: result.shareId });
}
