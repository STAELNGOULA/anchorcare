import { NextResponse } from "next/server";
import {
  getParentNotificationPreferences,
  listParentProgramConsents,
  updateParentNotificationPreferences,
  updateProgramConsent,
} from "@/lib/consents/consent-service";
import type {
  UpdateNotificationPreferencesInput,
  UpdateProgramConsentInput,
} from "@/lib/consents/consent-types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [programs, notifications] = await Promise.all([
    listParentProgramConsents(user.id),
    getParentNotificationPreferences(user.id),
  ]);

  return NextResponse.json({ programs, notifications });
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
    scope?: "program" | "notifications";
    program?: UpdateProgramConsentInput;
    notifications?: UpdateNotificationPreferencesInput;
  };

  if (body.scope === "notifications" && body.notifications) {
    const result = await updateParentNotificationPreferences(
      user.id,
      body.notifications,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, notifications: result.preferences });
  }

  if (body.scope === "program" && body.program?.registrationId) {
    const result = await updateProgramConsent(user.id, body.program);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
