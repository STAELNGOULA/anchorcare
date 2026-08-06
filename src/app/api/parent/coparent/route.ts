import { NextResponse } from "next/server";
import {
  createCoparentInvite,
  getCoparentWorkspaceData,
  revokeCoparentGuardian,
  revokeCoparentInvite,
} from "@/lib/coparent/coparent-service";
import type { GuardianPermission } from "@/lib/coparent/coparent-types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCoparentWorkspaceData(user.id);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    childId?: string;
    inviteEmail?: string;
    permission?: GuardianPermission;
  };

  if (!body.childId || !body.inviteEmail?.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const permission: GuardianPermission =
    body.permission === "full" ? "full" : "view";

  const result = await createCoparentInvite(user.id, {
    childId: body.childId,
    inviteEmail: body.inviteEmail,
    permission,
  });

  if (!result.ok) {
    const status = result.error === "notFound" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    ok: true,
    inviteId: result.inviteId,
    inviteUrl: `${origin}/invite/coparent/${result.token}`,
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const inviteId = params.get("inviteId");
  const guardianId = params.get("guardianId");

  if (inviteId) {
    const result = await revokeCoparentInvite(user.id, inviteId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (guardianId) {
    const result = await revokeCoparentGuardian(user.id, guardianId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
