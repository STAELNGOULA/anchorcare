import { NextResponse } from "next/server";
import { acceptCoparentInvite } from "@/lib/coparent/coparent-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { token?: string };
  if (!body.token) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await acceptCoparentInvite(user.id, user.email ?? null, body.token);
  if (!result.ok) {
    const status =
      result.error === "notFound"
        ? 404
        : result.error === "wrongEmail"
          ? 403
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, childId: result.childId });
}
