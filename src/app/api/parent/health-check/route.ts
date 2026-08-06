import { NextResponse } from "next/server";
import { z } from "zod";
import { submitMorningHealthCheck } from "@/lib/health/health-check-service";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  childId: z.string().uuid(),
  healthStatus: z.enum(["healthy", "mild_symptoms", "staying_home"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await submitMorningHealthCheck(user.id, {
    childId: parsed.data.childId,
    healthStatus: parsed.data.healthStatus,
    note: parsed.data.note,
  });

  if ("error" in result) {
    const status = result.error === "forbidden" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ check: result });
}
