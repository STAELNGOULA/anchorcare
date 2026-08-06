import { NextResponse } from "next/server";
import {
  createChildForParent,
  listChildrenForParent,
} from "@/lib/parent/children-service";
import { childCreateSchema } from "@/lib/parent/child-validation";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const children = await listChildrenForParent(user.id);
  return NextResponse.json({ ok: true, children });
}

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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = childCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validationError",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createChildForParent(user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, child: result.child }, { status: 201 });
}
