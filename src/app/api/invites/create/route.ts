import { NextResponse } from "next/server";
import { createParentInvite } from "@/lib/invites/invite-service";
import { createInviteSchema } from "@/lib/invites/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "business_admin" || !profile.org_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validationError" }, { status: 400 });
  }

  try {
    const invite = await createParentInvite({
      orgId: profile.org_id,
      programId: parsed.data.programId,
      email: parsed.data.email,
      childFirstName: parsed.data.childFirstName,
    });

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(invite.inviteUrl)}`;

    return NextResponse.json({
      ok: true,
      ...invite,
      qrImageUrl,
    });
  } catch {
    return NextResponse.json({ error: "createFailed" }, { status: 500 });
  }
}
