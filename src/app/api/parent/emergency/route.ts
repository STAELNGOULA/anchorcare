import { NextResponse } from "next/server";
import {
  listParentEmergencyChildren,
  updateEmergencyConsents,
} from "@/lib/emergency/emergency-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const children = await listParentEmergencyChildren(user.id);
  return NextResponse.json({ children });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    registrationId?: string;
    sharePhotos?: boolean;
    shareAllergies?: boolean;
    shareMeds?: boolean;
    shareContacts?: boolean;
  };
  if (!body.registrationId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await updateEmergencyConsents(user.id, body.registrationId, {
    sharePhotos: body.sharePhotos,
    shareAllergies: body.shareAllergies,
    shareMeds: body.shareMeds,
    shareContacts: body.shareContacts,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
