import { NextResponse } from "next/server";
import {
  acceptCoachInvite,
  acceptParentInvite,
} from "@/lib/invites/accept-service";
import { getInviteDetailByToken } from "@/lib/invites/invite-service";
import { acceptParentInviteSchema } from "@/lib/invites/validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "notAuthenticated" }, { status: 401 });
  }

  const invite = await getInviteDetailByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "inviteNotFound" }, { status: 404 });
  }

  if (invite.inviteType === "coach") {
    const result = await acceptCoachInvite(user.id, token);
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true, redirectTo: result.redirectTo });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = acceptParentInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "childRequired", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await acceptParentInvite(user.id, {
    token,
    childId: parsed.data.childId,
    newChild: parsed.data.newChild,
    copyHealthProfile: parsed.data.copyHealthProfile,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, redirectTo: result.redirectTo });
}
