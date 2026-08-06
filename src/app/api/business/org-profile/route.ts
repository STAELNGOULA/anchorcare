import { NextResponse } from "next/server";
import {
  getOrgProfileForDirector,
  updateOrgProfile,
} from "@/lib/business/org-profile-service";
import { orgProfilePatchSchema } from "@/lib/business/org-profile-validation";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getOrgProfileForDirector(user.id);
  if (!profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = orgProfilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validationError",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await updateOrgProfile(user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, fieldErrors: result.fieldErrors },
      { status: result.code === "forbidden" ? 403 : 400 },
    );
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}
