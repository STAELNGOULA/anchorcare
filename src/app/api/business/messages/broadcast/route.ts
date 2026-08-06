import { NextResponse } from "next/server";
import {
  getBroadcastQuota,
  listBroadcastPrograms,
  sendProgramBroadcast,
} from "@/lib/messaging/broadcast-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const programId = url.searchParams.get("programId");

  if (programId) {
    const quota = await getBroadcastQuota(programId);
    return NextResponse.json({ ok: true, quota });
  }

  const programs = await listBroadcastPrograms(user.id, orgId);
  return NextResponse.json({ ok: true, programs });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { programId?: string; body?: string };
  if (!body.programId) {
    return NextResponse.json({ error: "program_required" }, { status: 422 });
  }

  const result = await sendProgramBroadcast(user.id, orgId, {
    programId: body.programId,
    body: body.body ?? "",
  });

  if ("error" in result) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "invalid_body"
          ? 422
          : result.error === "forbidden"
            ? 403
            : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    broadcastId: result.broadcastId,
    recipientCount: result.recipientCount,
  });
}
