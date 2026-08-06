import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createHandoffNote,
  listHandoffNotesForOrg,
} from "@/lib/handoff/handoff-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  programId: z.string().uuid(),
  note: z.string().trim().min(1).max(2000),
  shiftDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const shiftDate = searchParams.get("shiftDate") ?? undefined;
  const notes = await listHandoffNotesForOrg(orgId, shiftDate);

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
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
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await createHandoffNote(user.id, orgId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ note: result });
}
