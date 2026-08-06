import { NextResponse } from "next/server";
import { rolloverProgramSeason } from "@/lib/business/season-rollover-service";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  newSeasonName: z.string().trim().min(2).max(120),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: programId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validationError" }, { status: 400 });

  const result = await rolloverProgramSeason(user.id, programId, parsed.data.newSeasonName);
  if (!result.ok) return NextResponse.json({ error: result.code }, { status: 400 });

  return NextResponse.json({
    ok: true,
    newProgramId: result.newProgramId,
    invitesSent: result.invitesSent,
  });
}
