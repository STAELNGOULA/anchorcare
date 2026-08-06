import { NextResponse } from "next/server";
import {
  deleteChildForParent,
  getChildForParent,
  updateChildForParent,
} from "@/lib/parent/children-service";
import { childUpdateSchema } from "@/lib/parent/child-validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function assertParent(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "parent";
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await assertParent(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const child = await getChildForParent(user.id, id);
  if (!child) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, child });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await assertParent(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = childUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validationError",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await updateChildForParent(user.id, id, parsed.data);
  if (!result.ok) {
    const status = result.code === "notFound" ? 404 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }

  return NextResponse.json({ ok: true, child: result.child });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await assertParent(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await deleteChildForParent(user.id, id);
  if (!result.ok) {
    const status =
      result.code === "notFound"
        ? 404
        : result.code === "activeRegistration"
          ? 409
          : 400;
    return NextResponse.json({ error: result.code }, { status });
  }

  return NextResponse.json({ ok: true });
}
