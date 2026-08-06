import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrgDigestSettings,
  updateOrgDigestSettings,
} from "@/lib/digest/digest-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  businessEnabled: z.boolean(),
  businessDeliveryDay: z.number().int().min(0).max(6),
  businessRecipientEmails: z.array(z.string().trim().email()).max(10),
  coachDigestEnabled: z.boolean(),
  timezone: z.string().trim().min(1).max(64),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getOrgDigestSettings(orgId);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const settings = await updateOrgDigestSettings(orgId, parsed.data);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
