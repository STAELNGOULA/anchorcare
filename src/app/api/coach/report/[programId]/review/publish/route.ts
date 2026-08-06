import { NextResponse } from "next/server";
import { publishDailyReport } from "@/lib/reports/review-report-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ programId: string }> };

async function requireCoach(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return profile?.role === "coach" || profile?.role === "business_admin";
}

export async function POST(request: Request, context: RouteContext) {
  const { programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireCoach(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const headerKey = request.headers.get("idempotency-key");
  const body = (await request.json().catch(() => ({}))) as {
    publishToken?: string;
  };
  const idempotencyKey = headerKey ?? body.publishToken;

  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json({ error: "Missing publish token" }, { status: 400 });
  }

  const result = await publishDailyReport(user.id, programId, idempotencyKey);
  if (!result.ok) {
    const status =
      result.code === "trial_lapsed"
        ? 402
        : result.code === "misassigned_pending"
          ? 409
          : result.code === "untagged_media"
            ? 422
            : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({ result: result.result });
}
